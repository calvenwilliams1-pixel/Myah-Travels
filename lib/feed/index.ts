import { db } from "@/lib/db";
import { posts, categories, tags, postTags } from "@/drizzle/schema";
import { eq, and, isNull, sql, inArray, exists } from "drizzle-orm";
import { resolveFamily } from "@/lib/tags/aliases";
import { loadTemplatesFromDb } from "@/lib/blocks/template-store";

export interface FeedTag {
  id: number;
  name: string;
  slug: string;
}

export interface FeedItem {
  id: number;
  /** Always "post" since the type overhaul — a post's template is its type. */
  type: "post";
  /** The template (post type) this post was written under, if any. */
  templateId: string | null;
  templateName: string | null;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  slug: string;
  publishedAt: string;
  isPinned: boolean;
  isHighlighted: boolean;
  category: string | null;
  tags: FeedTag[];
}

export interface FeedTemplateFilter {
  id: string;
  name: string;
  count: number;
}

const TEMPLATE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Extract the templateId stored inside a post's content JSON. */
export function templateIdFromContent(content: string | null): string | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    return typeof parsed?.templateId === "string" ? parsed.templateId : null;
  } catch {
    return null;
  }
}

async function hydrateTags(items: FeedItem[]): Promise<FeedItem[]> {
  if (items.length === 0) return items;

  const postIds = items.map((i) => i.id);
  const tagMap = new Map<number, FeedTag[]>();
  const rows = await db
    .select({ itemId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));
  for (const r of rows) {
    if (!tagMap.has(r.itemId)) tagMap.set(r.itemId, []);
    tagMap.get(r.itemId)!.push({ id: r.id, name: r.name, slug: r.slug });
  }

  return items.map((item) => ({ ...item, tags: tagMap.get(item.id) ?? [] }));
}

/**
 * Feed items. Since the type overhaul (Nov 23, 2026) the feed is posts
 * only, and a post's "type" is its template: `contentType` is either
 * "all" or a template slug, matched against the templateId stored in
 * each post's content JSON.
 */
export async function getFeedItems(
  contentType: string = "all",
  sort: string = "newest",
  limit: number = 20,
  offset: number = 0,
  tagSlugs: string[] = []
): Promise<FeedItem[]> {
  if (contentType !== "all" && !TEMPLATE_SLUG.test(contentType)) {
    return [];
  }

  const orderByClause =
    sort === "pinned"
      ? sql`is_pinned DESC, is_highlighted DESC, published_at DESC`
      : sort === "oldest"
      ? sql`published_at ASC`
      : sql`published_at DESC`;

  // Resolve tag families once. Each requested slug expands to its family
  // (canonical + aliases). Dedupe families that resolve to the same set so
  // ?tags=disney,disneyland does not double-filter on the same family.
  let families: string[][] = [];
  if (tagSlugs.length > 0) {
    const resolved = await Promise.all(tagSlugs.map((s) => resolveFamily(s)));
    const seen = new Set<string>();
    for (const fam of resolved) {
      const key = [...fam].sort().join(",");
      if (!seen.has(key)) {
        seen.add(key);
        families.push(fam);
      }
    }
  }

  const conditions = [eq(posts.status, "published"), isNull(posts.deletedAt)];

  if (contentType !== "all") {
    conditions.push(sql`${posts.content} LIKE ${'%"templateId":"' + contentType + '"%'}`);
  }

  for (const family of families) {
    conditions.push(
      exists(
        db
          .select({ x: sql`1` })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(and(eq(postTags.postId, posts.id), inArray(tags.slug, family)))
      )
    );
  }

  const result = await db
    .select({
      id: posts.id,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      slug: posts.slug,
      publishedAt: posts.publishedAt,
      isPinned: posts.isPinned,
      isHighlighted: posts.isHighlighted,
      content: posts.content,
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  // Template names for the badge on each card.
  const templates = await loadTemplatesFromDb();
  const nameById = new Map(templates.map((t) => [t.id, t.name]));

  const mapped: FeedItem[] = result.map((row) => {
    const templateId = templateIdFromContent(row.content);
    return {
      id: row.id,
      type: "post" as const,
      templateId,
      templateName: templateId ? nameById.get(templateId) ?? null : null,
      title: row.title,
      excerpt: row.excerpt ?? "",
      featuredImage: row.featuredImage,
      slug: row.slug,
      publishedAt: row.publishedAt ?? "",
      isPinned: row.isPinned ?? false,
      isHighlighted: row.isHighlighted ?? false,
      category: null,
      tags: [],
    };
  });
  return hydrateTags(mapped);
}

/**
 * The homepage filter pills: one per template that has at least one
 * published post (Cal's rule, Nov 23, 2026 — a filter appears when the
 * template's first post is published, never as an empty shelf).
 * Ordered by template name.
 */
export async function getFeedTemplateFilters(): Promise<FeedTemplateFilter[]> {
  const templates = await loadTemplatesFromDb();
  const published = await db
    .select({ content: posts.content })
    .from(posts)
    .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)));

  const counts = new Map<string, number>();
  for (const row of published) {
    const id = templateIdFromContent(row.content);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return templates
    .filter((t) => (counts.get(t.id) ?? 0) > 0)
    .map((t) => ({ id: t.id, name: t.name, count: counts.get(t.id)! }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getCategories(): Promise<string[]> {
  const result = await db.select({ name: categories.name }).from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(categories.sortOrder);
  return result.map((c) => c.name);
}
