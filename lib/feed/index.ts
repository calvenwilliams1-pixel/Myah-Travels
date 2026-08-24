import { db } from "@/lib/db";
import { posts, guides, reviews, categories } from "@/drizzle/schema";
import { eq, and, isNull, desc, asc, sql } from "drizzle-orm";

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
}

export async function getFeedItems(
  contentType: string = "all",
  sort: string = "newest",
  category: string = "all",
  limit: number = 20,
  offset: number = 0
): Promise<FeedItem[]> {
  const orderByClause =
    sort === "pinned"
      ? sql`is_pinned DESC, is_highlighted DESC, published_at DESC`
      : sort === "oldest"
      ? sql`published_at ASC`
      : sql`published_at DESC`;

  const buildSelect = (table: any, type: string) => {
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
      .where(and(eq(table.status, "published"), isNull(table.deletedAt)));
  };

  const queries: any[] = [];

  if (contentType === "all" || contentType === "post") {
    queries.push(buildSelect(posts, "post"));
  }
  if (contentType === "all" || contentType === "guide") {
    queries.push(buildSelect(guides, "guide"));
  }
  if (contentType === "all" || contentType === "review") {
    queries.push(buildSelect(reviews, "review"));
  }

  if (queries.length === 0) {
    return [];
  }

  if (queries.length === 1) {
    const result = await queries[0]
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    return result.map((row: any) => ({
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
    }));
  }

  // Multiple queries - use UNION ALL
  const unionQuery = queries[0];
  for (let i = 1; i < queries.length; i++) {
    unionQuery.unionAll(queries[i]);
  }

  const result = await unionQuery
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset);

  return result.map((row: any) => ({
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
  }));
}

export async function getCategories(): Promise<string[]> {
  const result = await db.select({ name: categories.name }).from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(categories.sortOrder);
  return result.map((c) => c.name);
}
