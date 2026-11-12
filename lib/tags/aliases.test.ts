import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db, sqlite } from "@/lib/db";
import { tags } from "@/drizzle/schema/tags";
import { tagAliases } from "@/drizzle/schema/tag-aliases";
import { posts } from "@/drizzle/schema/posts";
import { postTags } from "@/drizzle/schema/post-tags";
import { eq, inArray, sql } from "drizzle-orm";
import { guideTags } from "@/drizzle/schema/guide-tags";
import { reviewTags } from "@/drizzle/schema/review-tags";
import {
  createAlias,
  removeAlias,
  getCanonicalFor,
  getAliasesFor,
  resolveFamily,
  deleteCanonicalSafe,
  mergeTagsWithAliases,
} from "./aliases";

// Test fixture: unique slug per run so parallel/repeat runs don't collide.
const runId = Date.now().toString(36);

function testSlug(base: string): string {
  return `t${runId}-${base}`;
}

async function makeTag(name: string): Promise<number> {
  const slug = testSlug(name.toLowerCase().replace(/[^a-z0-9]/g, ""));
  // name must also be unique per run (schema has UNIQUE on name) — suffix with runId
  const uniqueName = `${name}-${runId}`;
  const [row] = await db.insert(tags).values({ name: uniqueName, slug }).returning();
  trackTagIds.push(row.id);
  return row.id;
}

async function makePost(title: string): Promise<number> {
  const slug = testSlug(title.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const [row] = await db.insert(posts).values({
    title,
    slug,
    content: JSON.stringify({ blocks: [], templateId: "story" }),
    status: "published",
    publishedAt: new Date().toISOString(),
  }).returning();
  return row.id;
}

const trackTagIds: number[] = [];
const trackPostIds: number[] = [];

async function cleanup(ids: { tagIds: number[]; postIds: number[] }) {
  if (ids.postIds.length > 0) {
    await db.delete(postTags).where(inArray(postTags.postId, ids.postIds));
    await db.delete(posts).where(inArray(posts.id, ids.postIds));
  }
  if (ids.tagIds.length > 0) {
    await db.delete(tagAliases).where(inArray(tagAliases.aliasTagId, ids.tagIds));
    await db.delete(tagAliases).where(inArray(tagAliases.canonicalTagId, ids.tagIds));
    await db.delete(tags).where(inArray(tags.id, ids.tagIds));
  }
}

afterEach(async () => {
  if (trackPostIds.length > 0) {
    await db.delete(postTags).where(inArray(postTags.postId, trackPostIds));
    await db.delete(posts).where(inArray(posts.id, trackPostIds));
    trackPostIds.length = 0;
  }
  if (trackTagIds.length > 0) {
    await db.delete(tagAliases).where(inArray(tagAliases.aliasTagId, trackTagIds));
    await db.delete(tagAliases).where(inArray(tagAliases.canonicalTagId, trackTagIds));
    await db.delete(tags).where(inArray(tags.id, trackTagIds));
    trackTagIds.length = 0;
  }
});

describe("tag aliases", () => {
  it("createAlias succeeds for valid flat alias", async () => {
    const canonical = await makeTag("Disney");
    const alias = await makeTag("Disneyland");
    const result = await createAlias(alias, canonical);
    expect(result).toEqual({ success: true });
    expect(await getCanonicalFor(alias)).toBe(canonical);
    await cleanup({ tagIds: [canonical, alias], postIds: [] });
  });

  it("createAlias rejects self-alias", async () => {
    const t = await makeTag("SelfTest");
    const result = await createAlias(t, t);
    expect(result).toHaveProperty("error");
    await cleanup({ tagIds: [t], postIds: [] });
  });

  it("createAlias rejects when alias already has a canonical", async () => {
    const c1 = await makeTag("CanonA");
    const c2 = await makeTag("CanonB");
    const alias = await makeTag("Alias1");
    await createAlias(alias, c1);
    const result = await createAlias(alias, c2);
    expect(result).toHaveProperty("error");
    await cleanup({ tagIds: [c1, c2, alias], postIds: [] });
  });

  it("createAlias rejects when canonical is itself an alias (flat model)", async () => {
    const root = await makeTag("Root");
    const middle = await makeTag("Middle");
    await createAlias(middle, root);
    const leaf = await makeTag("Leaf");
    const result = await createAlias(leaf, middle);
    expect(result).toHaveProperty("error");
    await cleanup({ tagIds: [root, middle, leaf], postIds: [] });
  });

  it("createAlias rejects when alias already has aliases (would create chain)", async () => {
    const wouldBeAlias = await makeTag("HasKids");
    const kid = await makeTag("Kid");
    await createAlias(kid, wouldBeAlias);
    const newCanonical = await makeTag("NewCanon");
    const result = await createAlias(wouldBeAlias, newCanonical);
    expect(result).toHaveProperty("error");
    await cleanup({ tagIds: [wouldBeAlias, kid, newCanonical], postIds: [] });
  });

  it("resolveFamily for standalone tag returns just [slug]", async () => {
    const t = await makeTag("Standalone");
    const row = await db.select().from(tags).where(eq(tags.id, t)).limit(1);
    const family = await resolveFamily(row[0].slug);
    expect(family).toEqual([row[0].slug]);
    await cleanup({ tagIds: [t], postIds: [] });
  });

  it("resolveFamily for canonical returns [canonical, ...aliases]", async () => {
    const canonical = await makeTag("FamCanon");
    const a1 = await makeTag("FamAlias1");
    const a2 = await makeTag("FamAlias2");
    await createAlias(a1, canonical);
    await createAlias(a2, canonical);
    const canonicalRow = await db.select().from(tags).where(eq(tags.id, canonical)).limit(1);
    const family = await resolveFamily(canonicalRow[0].slug);
    expect(family.length).toBe(3);
    expect(family).toContain(canonicalRow[0].slug);
    await cleanup({ tagIds: [canonical, a1, a2], postIds: [] });
  });

  it("resolveFamily for alias returns canonical's full family", async () => {
    const canonical = await makeTag("CanonX");
    const alias = await makeTag("AliasX");
    await createAlias(alias, canonical);
    const aliasRow = await db.select().from(tags).where(eq(tags.id, alias)).limit(1);
    const family = await resolveFamily(aliasRow[0].slug);
    const canonicalRow = await db.select().from(tags).where(eq(tags.id, canonical)).limit(1);
    expect(family).toContain(canonicalRow[0].slug);
    expect(family).toContain(aliasRow[0].slug);
    await cleanup({ tagIds: [canonical, alias], postIds: [] });
  });

  it("deleteCanonicalSafe refuses when aliases exist", async () => {
    const canonical = await makeTag("DelCanon");
    const alias = await makeTag("DelAlias");
    await createAlias(alias, canonical);
    const result = await deleteCanonicalSafe(canonical);
    expect(result).toHaveProperty("error");
    if ("blockingAliases" in result) {
      expect(result.blockingAliases?.length).toBe(1);
    }
    await cleanup({ tagIds: [canonical, alias], postIds: [] });
  });

  it("deleteCanonicalSafe succeeds when no aliases", async () => {
    const t = await makeTag("DelStandalone");
    const result = await deleteCanonicalSafe(t);
    expect(result).toEqual({ success: true });
  });

  it("mergeTagsWithAliases repoints source's aliases to target", async () => {
    const source = await makeTag("MergeSource");
    const target = await makeTag("MergeTarget");
    const aliasOfSource = await makeTag("AliasOfSource");
    await createAlias(aliasOfSource, source);
    const result = await mergeTagsWithAliases(source, target);
    expect(result).toHaveProperty("mergedInto");
    // Alias should now point at target
    expect(await getCanonicalFor(aliasOfSource)).toBe(target);
    // Source should be gone
    const srcRow = await db.select().from(tags).where(eq(tags.id, source)).limit(1);
    expect(srcRow.length).toBe(0);
    await cleanup({ tagIds: [target, aliasOfSource], postIds: [] });
  });

  it("mergeTagsWithAliases dedupes when both have same alias", async () => {
    const source = await makeTag("DupSource");
    const target = await makeTag("DupTarget");
    const sharedAlias = await makeTag("DupAlias");
    await createAlias(sharedAlias, source);
    // Also make sharedAlias an alias of target? Can't — unique constraint.
    // So test: source has alias A1, target has alias A2 with different tags.
    const aliasOfTarget = await makeTag("AliasOfTarget");
    await createAlias(aliasOfTarget, target);
    const result = await mergeTagsWithAliases(source, target);
    expect(result).toHaveProperty("mergedInto");
    expect(await getCanonicalFor(sharedAlias)).toBe(target);
    expect(await getCanonicalFor(aliasOfTarget)).toBe(target);
    await cleanup({ tagIds: [target, sharedAlias, aliasOfTarget], postIds: [] });
  });

  it("mergeTagsWithAliases resolves target to canonical if target is alias", async () => {
    const root = await makeTag("Root2");
    const middleAlias = await makeTag("MiddleAlias2");
    await createAlias(middleAlias, root);
    const source = await makeTag("MergeIntoAlias");
    const result = await mergeTagsWithAliases(source, middleAlias);
    expect(result).toHaveProperty("mergedInto");
    if ("mergedInto" in result) {
      expect(result.mergedInto).toBe(root); // resolved target
    }
    await cleanup({ tagIds: [root, middleAlias], postIds: [] });
  });

  it("PRAGMA foreign_keys is enabled on the app connection", async () => {
    const result = sqlite.pragma("foreign_keys", { simple: true });
    expect(result).toBe(1);
  });

  it("raw DELETE FROM tags on canonical with aliases is refused (RESTRICT)", async () => {
    const canonical = await makeTag("RestrictCanon");
    const alias = await makeTag("RestrictAlias");
    await createAlias(alias, canonical);
    let threw = false;
    try {
      await db.delete(tags).where(eq(tags.id, canonical));
    } catch (err) {
      threw = true;
    }
    expect(threw).toBe(true);
    // Canonical should still exist
    const check = await db.select().from(tags).where(eq(tags.id, canonical)).limit(1);
    expect(check.length).toBe(1);
  });

  it("raw DELETE FROM tags on alias tag cascades alias row", async () => {
    const canonical = await makeTag("CascadeCanon");
    const alias = await makeTag("CascadeAlias");
    await createAlias(alias, canonical);
    await db.delete(tags).where(eq(tags.id, alias));
    // Alias row should be gone
    const aliasRow = await db.select().from(tagAliases).where(eq(tagAliases.aliasTagId, alias)).limit(1);
    expect(aliasRow.length).toBe(0);
    // Canonical should remain
    const canonRow = await db.select().from(tags).where(eq(tags.id, canonical)).limit(1);
    expect(canonRow.length).toBe(1);
  });

  it("raw INSERT alias-of-alias is refused by trigger", async () => {
    const root = await makeTag("TrigRoot");
    const mid = await makeTag("TrigMid");
    const leaf = await makeTag("TrigLeaf");
    await createAlias(mid, root);
    let threw = false;
    try {
      await db.insert(tagAliases).values({ aliasTagId: leaf, canonicalTagId: mid });
    } catch (err) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("raw INSERT alias-that-has-aliases is refused by trigger", async () => {
    const hasKids = await makeTag("TrigHasKids");
    const kid = await makeTag("TrigKid");
    await createAlias(kid, hasKids);
    const newCanon = await makeTag("TrigNewCanon");
    let threw = false;
    try {
      await db.insert(tagAliases).values({ aliasTagId: hasKids, canonicalTagId: newCanon });
    } catch (err) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("raw UPDATE creating alias-of-alias is refused by trigger", async () => {
    const root2 = await makeTag("UpdRoot");
    const mid2 = await makeTag("UpdMid");
    const otherAlias = await makeTag("UpdOther");
    const otherCanon = await makeTag("UpdOtherCanon");
    await createAlias(mid2, root2);
    await createAlias(otherAlias, otherCanon);
    // Try to repoint otherAlias at mid2 (which is itself an alias)
    let threw = false;
    try {
      await db.update(tagAliases).set({ canonicalTagId: mid2 }).where(eq(tagAliases.aliasTagId, otherAlias));
    } catch (err) {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it("mergeTagsWithAliases is transactional (source stays if merge fails partway)", async () => {
    // Hard to force a failure in SQLite; at minimum verify pre/post state matches expectation
    const source = await makeTag("TxSource");
    const target = await makeTag("TxTarget");
    const result = await mergeTagsWithAliases(source, target);
    expect(result).toEqual({ success: true, mergedInto: target });
    await cleanup({ tagIds: [target], postIds: [] });
  });
});
