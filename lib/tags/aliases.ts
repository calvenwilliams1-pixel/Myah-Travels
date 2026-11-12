import { db } from "@/lib/db";
import { tags } from "@/drizzle/schema/tags";
import { tagAliases } from "@/drizzle/schema/tag-aliases";
import { eq, and, sql, inArray } from "drizzle-orm";
import { postTags } from "@/drizzle/schema/post-tags";
import { guideTags } from "@/drizzle/schema/guide-tags";
import { reviewTags } from "@/drizzle/schema/review-tags";

/**
 * Flat alias model.
 *
 * A tag is EITHER canonical (may have aliases) OR an alias (points at exactly
 * one canonical). Never both. No chains, no cycles.
 *
 * Invariants enforced here:
 *   - alias != canonical (DB CHECK also enforces)
 *   - alias has at most one canonical (DB UNIQUE also enforces)
 *   - canonical cannot itself be an alias
 *   - alias cannot itself have aliases (would create a chain)
 *   - createAlias / deleteCanonicalSafe / mergeTagsWithAliases run in transactions
 */

export interface AliasMapEntry {
  /** If this tag is an alias, the canonical tag it points at. */
  isAliasOf?: { id: number; name: string; slug: string };
  /** If this tag is canonical, the aliases pointing at it. */
  aliasesOf: { id: number; name: string; slug: string }[];
}

/**
 * One-query lookup of all alias relationships, keyed by tag id.
 * Used by the admin tags page to render "Alias of #x" and "Aliases: #a, #b"
 * without N+1 queries.
 */
export async function getAliasMap(): Promise<Map<number, AliasMapEntry>> {
  const allAliases = await db.select().from(tagAliases);
  if (allAliases.length === 0) {
    return new Map();
  }

  const tagIds = new Set<number>();
  for (const a of allAliases) {
    tagIds.add(a.aliasTagId);
    tagIds.add(a.canonicalTagId);
  }

  const tagRows = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(tags)
    .where(inArray(tags.id, Array.from(tagIds)));

  const tagLookup = new Map<number, { id: number; name: string; slug: string }>();
  for (const t of tagRows) tagLookup.set(t.id, t);

  const result = new Map<number, AliasMapEntry>();

  for (const a of allAliases) {
    const aliasTag = tagLookup.get(a.aliasTagId);
    const canonicalTag = tagLookup.get(a.canonicalTagId);
    if (!aliasTag || !canonicalTag) continue;

    const aliasEntry = result.get(a.aliasTagId) ?? { aliasesOf: [] };
    aliasEntry.isAliasOf = canonicalTag;
    result.set(a.aliasTagId, aliasEntry);

    const canonEntry = result.get(a.canonicalTagId) ?? { aliasesOf: [] };
    canonEntry.aliasesOf.push(aliasTag);
    result.set(a.canonicalTagId, canonEntry);
  }

  return result;
}

export interface AliasRow {
  id: number;
  aliasTagId: number;
  canonicalTagId: number;
}

/** All aliases pointing at this canonical tag. */
export async function getAliasesFor(canonicalId: number): Promise<AliasRow[]> {
  return db.select().from(tagAliases).where(eq(tagAliases.canonicalTagId, canonicalId));
}

/** If this tag is an alias, returns the canonical id. Otherwise null. */
export async function getCanonicalFor(aliasId: number): Promise<number | null> {
  const rows = await db.select().from(tagAliases).where(eq(tagAliases.aliasTagId, aliasId)).limit(1);
  return rows[0]?.canonicalTagId ?? null;
}

/**
 * Resolve a slug to its full family.
 *
 * - If slug is canonical: [canonicalSlug, ...aliasSlugs]
 * - If slug is an alias: [canonicalSlug, ...aliasSlugs] of its canonical family
 * - If slug is standalone: [slug]
 */
export async function resolveFamily(slug: string): Promise<string[]> {
  const tagRows = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (tagRows.length === 0) return [slug];
  const tag = tagRows[0];

  // Is it an alias?
  const canonicalId = await getCanonicalFor(tag.id);
  if (canonicalId !== null) {
    return resolveFamilyById(canonicalId);
  }

  // Is it canonical (has aliases)?
  const aliases = await getAliasesFor(tag.id);
  if (aliases.length === 0) return [tag.slug];

  const canonical = await db.select().from(tags).where(eq(tags.id, tag.id)).limit(1);
  const aliasSlugs: string[] = [];
  for (const a of aliases) {
    const t = await db.select().from(tags).where(eq(tags.id, a.aliasTagId)).limit(1);
    if (t[0]) aliasSlugs.push(t[0].slug);
  }
  return [canonical[0].slug, ...aliasSlugs];
}

async function resolveFamilyById(canonicalId: number): Promise<string[]> {
  const canonical = await db.select().from(tags).where(eq(tags.id, canonicalId)).limit(1);
  if (canonical.length === 0) return [];
  const aliases = await getAliasesFor(canonicalId);
  const aliasSlugs: string[] = [];
  for (const a of aliases) {
    const t = await db.select().from(tags).where(eq(tags.id, a.aliasTagId)).limit(1);
    if (t[0]) aliasSlugs.push(t[0].slug);
  }
  return [canonical[0].slug, ...aliasSlugs];
}

/**
 * Create an alias relationship. Throws on violation of flat-model invariants.
 */
export async function createAlias(aliasId: number, canonicalId: number): Promise<{ success: true } | { error: string }> {
  if (aliasId === canonicalId) return { error: "A tag cannot be an alias of itself" };

  const aliasRow = await db.select().from(tags).where(eq(tags.id, aliasId)).limit(1);
  if (aliasRow.length === 0) return { error: "Alias tag not found" };
  const canonicalRow = await db.select().from(tags).where(eq(tags.id, canonicalId)).limit(1);
  if (canonicalRow.length === 0) return { error: "Canonical tag not found" };

  // Canonical cannot itself be an alias.
  const canonicalIsAlias = await getCanonicalFor(canonicalId);
  if (canonicalIsAlias !== null) {
    return { error: `"${canonicalRow[0].name}" is already an alias of another tag — flat model does not allow chains` };
  }

  // Alias cannot itself have aliases (it would create a chain).
  const aliasHasAliases = await getAliasesFor(aliasId);
  if (aliasHasAliases.length > 0) {
    return { error: `"${aliasRow[0].name}" already has aliases pointing to it — cannot also become an alias` };
  }

  // Alias cannot already be an alias.
  const aliasIsAlias = await getCanonicalFor(aliasId);
  if (aliasIsAlias !== null) {
    return { error: `"${aliasRow[0].name}" is already an alias` };
  }

  try {
    db.transaction((tx) => {
      tx.insert(tagAliases).values({ aliasTagId: aliasId, canonicalTagId: canonicalId }).run();
    });
    return { success: true };
  } catch (err) {
    console.error("createAlias failed:", err);
    return { error: "Failed to create alias" };
  }
}

/** Remove an alias relationship. Safe: tag itself stays. */
export async function removeAlias(aliasId: number): Promise<{ success: true } | { error: string }> {
  try {
    db.transaction((tx) => {
      tx.delete(tagAliases).where(eq(tagAliases.aliasTagId, aliasId)).run();
    });
    return { success: true };
  } catch (err) {
    console.error("removeAlias failed:", err);
    return { error: "Failed to remove alias" };
  }
}

/**
 * Q1: refuse deletion of a canonical tag that has aliases. Lists them.
 * Does NOT delete the tag — caller decides what to do after seeing the error.
 */
export async function deleteCanonicalSafe(
  canonicalId: number
): Promise<{ success: true } | { error: string; blockingAliases?: { id: number; name: string }[] }> {
  const aliases = await getAliasesFor(canonicalId);
  if (aliases.length > 0) {
    const details: { id: number; name: string }[] = [];
    for (const a of aliases) {
      const t = await db.select().from(tags).where(eq(tags.id, a.aliasTagId)).limit(1);
      if (t[0]) details.push({ id: t[0].id, name: t[0].name });
    }
    const list = details.map((d) => `#${d.name}`).join(", ");
    return {
      error: `Cannot delete — ${aliases.length} alias${aliases.length === 1 ? "" : "es"} point here: ${list}. Remove aliases first.`,
      blockingAliases: details,
    };
  }

  try {
    db.transaction((tx) => {
      tx.delete(tags).where(eq(tags.id, canonicalId)).run();
    });
    return { success: true };
  } catch (err) {
    console.error("deleteCanonicalSafe failed:", err);
    return { error: "Failed to delete tag" };
  }
}

/**
 * Q2: merge source into target, repointing any of source's aliases to target.
 * Handles the three edge cases:
 *   1. If target is itself an alias, resolve to its canonical.
 *   2. If one of source's aliases already exists as an alias of target, dedupe.
 *   3. All operations in one transaction.
 */
export async function mergeTagsWithAliases(
  sourceId: number,
  targetId: number
): Promise<{ success: true; mergedInto: number } | { error: string }> {
  if (sourceId === targetId) return { error: "Cannot merge tag into itself" };

  const sourceRow = await db.select().from(tags).where(eq(tags.id, sourceId)).limit(1);
  if (sourceRow.length === 0) return { error: "Source tag not found" };
  let targetRow = await db.select().from(tags).where(eq(tags.id, targetId)).limit(1);
  if (targetRow.length === 0) return { error: "Target tag not found" };

  // Edge case 1: resolve target to its canonical if it's an alias.
  const targetIsAlias = await getCanonicalFor(targetId);
  const resolvedTargetId = targetIsAlias ?? targetId;
  if (resolvedTargetId !== targetId) {
    targetRow = await db.select().from(tags).where(eq(tags.id, resolvedTargetId)).limit(1);
    if (targetRow.length === 0) return { error: "Resolved target not found" };
  }

  // Cannot merge a canonical into itself via alias resolution.
  if (sourceId === resolvedTargetId) return { error: "Source and target resolve to the same tag" };

  try {
    db.transaction((tx) => {
      // Step 1: repoint source's aliases to target.
      const sourceAliases = tx.select().from(tagAliases).where(eq(tagAliases.canonicalTagId, sourceId)).all();
      for (const a of sourceAliases) {
        // Edge case 2: dedupe — if this alias already points at target, just delete.
        const existing = tx.select().from(tagAliases)
          .where(and(eq(tagAliases.aliasTagId, a.aliasTagId), eq(tagAliases.canonicalTagId, resolvedTargetId)))
          .all();
        if (existing.length > 0) {
          tx.delete(tagAliases).where(eq(tagAliases.aliasTagId, a.aliasTagId)).run();
        } else {
          tx.update(tagAliases).set({ canonicalTagId: resolvedTargetId }).where(eq(tagAliases.aliasTagId, a.aliasTagId)).run();
        }
      }

      // Step 2: repoint content tag junctions (post_tags, guide_tags, review_tags).
      // This mirrors lib/content's mergeTags body but is inline so it stays in one tx.
      const postAssocs = tx.select().from(postTags).where(eq(postTags.tagId, sourceId)).all();
      for (const a of postAssocs) {
        tx.insert(postTags).values({ postId: a.postId, tagId: resolvedTargetId }).onConflictDoNothing().run();
      }
      tx.delete(postTags).where(eq(postTags.tagId, sourceId)).run();

      const guideAssocs = tx.select().from(guideTags).where(eq(guideTags.tagId, sourceId)).all();
      for (const a of guideAssocs) {
        tx.insert(guideTags).values({ guideId: a.guideId, tagId: resolvedTargetId }).onConflictDoNothing().run();
      }
      tx.delete(guideTags).where(eq(guideTags.tagId, sourceId)).run();

      const reviewAssocs = tx.select().from(reviewTags).where(eq(reviewTags.tagId, sourceId)).all();
      for (const a of reviewAssocs) {
        tx.insert(reviewTags).values({ reviewId: a.reviewId, tagId: resolvedTargetId }).onConflictDoNothing().run();
      }
      tx.delete(reviewTags).where(eq(reviewTags.tagId, sourceId)).run();

      // Step 3: delete source tag. Cascade cleans up any alias rows that pointed
      // at source (already repointed), and any alias rows where source was alias
      // (source becomes alias via merge is a future enhancement, not done here).
      tx.delete(tags).where(eq(tags.id, sourceId)).run();
    });

    return { success: true, mergedInto: resolvedTargetId };
  } catch (err) {
    console.error("mergeTagsWithAliases failed:", err);
    return { error: "Failed to merge tags" };
  }
}
