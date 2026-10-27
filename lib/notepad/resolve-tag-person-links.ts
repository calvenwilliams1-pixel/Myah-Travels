import { db } from "@/lib/db";
import { people } from "@/drizzle/schema/people";
import { portalMembers } from "@/drizzle/schema/portal-members";
import { and, eq, sql } from "drizzle-orm";

export interface TagPersonLink {
  tag: string;
  personId: number | null;
}

/**
 * Resolve notepad tags to people records.
 *
 * Resolution order per tag:
 * 1. Portal member exact match (name or email) on this portal
 * 2. Global people.canonical_name case-insensitive exact match
 * 3. No match → personId: null
 *
 * Duplicate canonical names (2+ matches) resolve to null and log a warning —
 * no silent first-match. Ambiguity is safer than a wrong link.
 *
 * Exact string matching only. No fuzzy, no prefix, no email local-part
 * matching. Typos must not resolve.
 */
export async function resolveTagPersonLinks(
  tags: string[],
  portalId: number
): Promise<TagPersonLink[]> {
  const links: TagPersonLink[] = [];

  for (const rawTag of tags) {
    const tag = rawTag.trim();
    if (!tag) continue;

    // 1. Portal member exact match — name OR email
    const member = await db
      .select({ personId: portalMembers.personId })
      .from(portalMembers)
      .where(
        and(
          eq(portalMembers.portalId, portalId),
          sql`(${portalMembers.name} = ${tag} OR ${portalMembers.email} = ${tag})`
        )
      )
      .limit(1);

    if (member[0]?.personId) {
      links.push({ tag, personId: member[0].personId });
      continue;
    }

    // 2. Global people.canonical_name — case-insensitive exact
    const matches = await db
      .select({ id: people.id })
      .from(people)
      .where(sql`LOWER(${people.canonicalName}) = LOWER(${tag})`);

    if (matches.length === 0) {
      links.push({ tag, personId: null });
    } else if (matches.length === 1) {
      links.push({ tag, personId: matches[0].id });
    } else {
      console.warn(
        `[notepad] duplicate canonical_name "${tag}" (${matches.length} matches) — tag not linked`
      );
      links.push({ tag, personId: null });
    }
  }

  return links;
}
