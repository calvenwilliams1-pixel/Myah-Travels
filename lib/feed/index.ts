import { db } from "@/lib/db";
import { posts, guides, reviews, categories, tags, postTags, guideTags, reviewTags } from "@/drizzle/schema";
import { eq, and, isNull, desc, asc, sql, inArray } from "drizzle-orm";

export interface FeedTag {
  id: number;
  name: string;
  slug: string;
}

export interface FeedItem {
  id: number;
  type: "post" | "guide" | "review";
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

async function hydrateTags(items: FeedItem[]): Promise<FeedItem[]> {
  if (items.length === 0) return items;

  const postIds = items.filter((i) => i.type === "post").map((i) => i.id);
  const guideIds = items.filter((i) => i.type === "guide").map((i) => i.id);
  const reviewIds = items.filter((i) => i.type === "review").map((i) => i.id);

  const tagMap = new Map<string, FeedTag[]>();

  if (postIds.length > 0) {
    const rows = await db
      .select({ itemId: postTags.postId, id: tags.id, name: tags.name, slug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(inArray(postTags.postId, postIds));
    for (const r of rows) {
      const key = `post-${r.itemId}`;
      if (!tagMap.has(key)) tagMap.set(key, []);
      tagMap.get(key)!.push({ id: r.id, name: r.name, slug: r.slug });
    }
  }

  if (guideIds.length > 0) {
    const rows = await db
      .select({ itemId: guideTags.guideId, id: tags.id, name: tags.name, slug: tags.slug })
      .from(guideTags)
      .innerJoin(tags, eq(guideTags.tagId, tags.id))
      .where(inArray(guideTags.guideId, guideIds));
    for (const r of rows) {
      const key = `guide-${r.itemId}`;
      if (!tagMap.has(key)) tagMap.set(key, []);
      tagMap.get(key)!.push({ id: r.id, name: r.name, slug: r.slug });
    }
  }

  if (reviewIds.length > 0) {
    const rows = await db
      .select({ itemId: reviewTags.reviewId, id: tags.id, name: tags.name, slug: tags.slug })
      .from(reviewTags)
      .innerJoin(tags, eq(reviewTags.tagId, tags.id))
      .where(inArray(reviewTags.reviewId, reviewIds));
    for (const r of rows) {
      const key = `review-${r.itemId}`;
      if (!tagMap.has(key)) tagMap.set(key, []);
      tagMap.get(key)!.push({ id: r.id, name: r.name, slug: r.slug });
    }
  }

  return items.map((item) => ({
    ...item,
    tags: tagMap.get(`${item.type}-${item.id}`) ?? [],
  }));
}

export async function getFeedItems(
  contentType: string = "all",
  sort: string = "newest",
  limit: number = 20,
  offset: number = 0,
  tagSlugs: string[] = []
): Promise<FeedItem[]> {
  const orderByClause =
    sort === "pinned"
      ? sql`is_pinned DESC, is_highlighted DESC, published_at DESC`
      : sort === "oldest"
      ? sql`published_at ASC`
      : sql`published_at DESC`;

  const buildSelect = (
    table: any,
    type: string,
    junctionTable: any,
    junctionFk: any
  ) => {
    const conditions = [eq(table.status, "published"), isNull(table.deletedAt)];

    if (tagSlugs.length > 0) {
      const matchingIds = db
        .select({ id: junctionFk })
        .from(junctionTable)
        .innerJoin(tags, eq(junctionTable.tagId, tags.id))
        .where(inArray(tags.slug, tagSlugs))
        .groupBy(junctionFk)
        .having(sql`count(distinct ${tags.id}) = ${tagSlugs.length}`);
      conditions.push(inArray(table.id, matchingIds));
    }

    return db
      .select({
        id: table.id,
        title: table.title,
        excerpt: table.excerpt,
        featuredImage: table.featuredImage,
        slug: table.slug,
        publishedAt: table.publishedAt,
        isPinned: table.isPinned,
        isHighlighted: table.isHighlighted,
        type: sql`'${sql.raw(type)}'`.as("type"),
      })
      .from(table)
      .where(and(...conditions));
  };

  const queries: any[] = [];

  if (contentType === "all" || contentType === "post") {
    queries.push(buildSelect(posts, "post", postTags, postTags.postId));
  }
  if (contentType === "all" || contentType === "guide") {
    queries.push(buildSelect(guides, "guide", guideTags, guideTags.guideId));
  }
  if (contentType === "all" || contentType === "review") {
    queries.push(buildSelect(reviews, "review", reviewTags, reviewTags.reviewId));
  }

  if (queries.length === 0) {
    return [];
  }

  if (queries.length === 1) {
    const result = await queries[0]
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    const mapped = result.map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      excerpt: row.excerpt,
      featuredImage: row.featuredImage,
      slug: row.slug,
      publishedAt: row.publishedAt,
      isPinned: row.isPinned ?? false,
      isHighlighted: row.isHighlighted ?? false,
      category: null,
      tags: [],
    }));
    return hydrateTags(mapped);
  }

  // Multiple queries — use UNION ALL
  // Note: Drizzle's unionAll mutates the builder in place and returns it.
  // Reassigning is defensive — if the library changes to return a new object,
  // this loop still works.
  let unionQuery = queries[0];
  for (let i = 1; i < queries.length; i++) {
    unionQuery = unionQuery.unionAll(queries[i]);
  }

  const result = await unionQuery
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  const mapped = result.map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    excerpt: row.excerpt,
    featuredImage: row.featuredImage,
    slug: row.slug,
    publishedAt: row.publishedAt,
    isPinned: row.isPinned ?? false,
    isHighlighted: row.isHighlighted ?? false,
    category: null,
    tags: [],
  }));
  return hydrateTags(mapped);
}

export async function getCategories(): Promise<string[]> {
  const result = await db.select({ name: categories.name }).from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(categories.sortOrder);
  return result.map((c) => c.name);
}
