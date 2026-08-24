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
  const items: FeedItem[] = [];

  if (contentType === "all" || contentType === "post") {
    const postItems = await db.select({
      id: posts.id,
      title: posts.title,
      excerpt: posts.excerpt,
      featuredImage: posts.featuredImage,
      slug: posts.slug,
      publishedAt: posts.publishedAt,
      isPinned: posts.isPinned,
      isHighlighted: posts.isHighlighted,
    }).from(posts)
      .where(and(eq(posts.status, "published"), isNull(posts.deletedAt)))
      .limit(limit)
      .offset(offset);

    for (const item of postItems) {
      items.push({
        ...item,
        type: "post",
        category: null,
      });
    }
  }

  if (contentType === "all" || contentType === "guide") {
    const guideItems = await db.select({
      id: guides.id,
      title: guides.title,
      excerpt: guides.excerpt,
      featuredImage: guides.featuredImage,
      slug: guides.slug,
      publishedAt: guides.publishedAt,
      isPinned: guides.isPinned,
      isHighlighted: guides.isHighlighted,
    }).from(guides)
      .where(and(eq(guides.status, "published"), isNull(guides.deletedAt)))
      .limit(limit)
      .offset(offset);

    for (const item of guideItems) {
      items.push({
        ...item,
        type: "guide",
        category: null,
      });
    }
  }

  if (contentType === "all" || contentType === "review") {
    const reviewItems = await db.select({
      id: reviews.id,
      title: reviews.title,
      excerpt: reviews.excerpt,
      featuredImage: reviews.featuredImage,
      slug: reviews.slug,
      publishedAt: reviews.publishedAt,
      isPinned: reviews.isPinned,
      isHighlighted: reviews.isHighlighted,
    }).from(reviews)
      .where(and(eq(reviews.status, "published"), isNull(reviews.deletedAt)))
      .limit(limit)
      .offset(offset);

    for (const item of reviewItems) {
      items.push({
        ...item,
        type: "review",
        category: null,
      });
    }
  }

  // Sort
  if (sort === "pinned") {
    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  } else if (sort === "oldest") {
    items.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
  } else {
    // newest
    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  return items;
}

export async function getCategories(): Promise<string[]> {
  const result = await db.select({ name: categories.name }).from(categories)
    .where(eq(categories.isVisible, true))
    .orderBy(categories.sortOrder);
  return result.map((c) => c.name);
}
