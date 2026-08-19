import { db } from "@/lib/db";
import {
  posts,
  guides,
  reviews,
  videos,
  tags,
  categories,
  postTags,
  guideTags,
  reviewTags,
  relatedContent,
  revisions,
  redirects,
} from "@/drizzle/schema";
import { eq, and, desc, isNull, isNotNull } from "drizzle-orm";

// ============================================
// SLUG GENERATION
// ============================================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function generateUniqueSlug(
  baseSlug: string,
  type: "post" | "guide" | "review"
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let exists = false;

    if (type === "post") {
      const result = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
      exists = result.length > 0;
    } else if (type === "guide") {
      const result = await db.select().from(guides).where(eq(guides.slug, slug)).limit(1);
      exists = result.length > 0;
    } else {
      const result = await db.select().from(reviews).where(eq(reviews.slug, slug)).limit(1);
      exists = result.length > 0;
    }

    if (!exists) return slug;

    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }
}

// ============================================
// CATEGORIES
// ============================================

export async function getCategories() {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.deletedAt))
    .orderBy(categories.sortOrder);
}

export async function createCategory(name: string, slug?: string) {
  const catSlug = slug || generateSlug(name);
  return db.insert(categories).values({
    name,
    slug: catSlug,
  }).returning();
}

// ============================================
// TAGS
// ============================================

export async function getAllTags() {
  return db.select().from(tags).orderBy(tags.name);
}

export async function createTag(name: string) {
  const tagSlug = generateSlug(name);
  return db.insert(tags).values({
    name,
    slug: tagSlug,
  }).onConflictDoNothing().returning();
}

export async function getOrCreateTag(name: string) {
  const existing = await db.select().from(tags).where(eq(tags.name, name)).limit(1);
  if (existing.length > 0) return existing[0];
  
  const created = await createTag(name);
  return created[0] ?? null;
}

// ============================================
// POSTS
// ============================================

export async function getPosts(options?: {
  status?: string;
  limit?: number;
  includeDeleted?: boolean;
}) {
  const conditions = [];
  
  if (!options?.includeDeleted) {
    conditions.push(isNull(posts.deletedAt));
  }
  
  if (options?.status) {
    conditions.push(eq(posts.status, options.status));
  }
  
  let query = db.select().from(posts);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  query = query.orderBy(desc(posts.createdAt));
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  return query;
}

export async function getPostById(id: number) {
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getPostBySlug(slug: string) {
  const result = await db.select().from(posts)
    .where(and(eq(posts.slug, slug), isNull(posts.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function createPost(data: {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  status?: string;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
}) {
  const baseSlug = data.slug || generateSlug(data.title);
  const postSlug = await generateUniqueSlug(baseSlug, "post");
  
  const result = await db.insert(posts).values({
    title: data.title,
    slug: postSlug,
    content: data.content,
    excerpt: data.excerpt ?? null,
    status: data.status || "draft",
    featuredImage: data.featuredImage ?? null,
    seoTitle: data.seoTitle ?? null,
    seoDescription: data.seoDescription ?? null,
  }).returning();
  
  return result[0];
}

export async function updatePost(
  id: number,
  data: Partial<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: string;
    featuredImage: string;
    seoTitle: string;
    seoDescription: string;
    publishedAt: string;
  }>,
  options?: { skipRevision?: boolean }
) {
  return db.transaction(async (tx) => {
    const current = await tx.select().from(posts).where(eq(posts.id, id)).limit(1);
    
    if (current.length === 0) return null;
    
    if (!options?.skipRevision) {
      await tx.insert(revisions).values({
        contentType: "post",
        contentId: id,
        revisionData: JSON.stringify(current[0]),
      });
    }
    
    if (data.slug && current[0].slug !== data.slug) {
      await tx.insert(redirects).values({
        oldSlug: current[0].slug,
        newSlug: data.slug,
      }).onConflictDoNothing();
    }
    
    const result = await tx.update(posts)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, id))
      .returning();
    
    return result[0];
  });
}

export async function softDeletePost(id: number) {
  return db.update(posts)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(posts.id, id));
}

export async function hardDeletePost(id: number) {
  return db.delete(posts).where(eq(posts.id, id));
}

// ============================================
// GUIDES
// ============================================

export async function getGuides(options?: {
  status?: string;
  limit?: number;
}) {
  const conditions = [isNull(guides.deletedAt)];
  
  if (options?.status) {
    conditions.push(eq(guides.status, options.status));
  }
  
  let query = db.select().from(guides).where(and(...conditions));
  query = query.orderBy(desc(guides.createdAt));
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  return query;
}

export async function getGuideById(id: number) {
  const result = await db.select().from(guides).where(eq(guides.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getGuideBySlug(slug: string) {
  const result = await db.select().from(guides)
    .where(and(eq(guides.slug, slug), isNull(guides.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function createGuide(data: {
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  headerImage?: string;
  quickReference?: string;
  status?: string;
}) {
  const baseSlug = data.slug || generateSlug(data.title);
  const guideSlug = await generateUniqueSlug(baseSlug, "guide");
  
  const result = await db.insert(guides).values({
    title: data.title,
    slug: guideSlug,
    content: data.content,
    excerpt: data.excerpt ?? null,
    headerImage: data.headerImage ?? null,
    quickReference: data.quickReference ?? null,
    status: data.status || "draft",
  }).returning();
  
  return result[0];
}

export async function updateGuide(
  id: number,
  data: Partial<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    headerImage: string;
    quickReference: string;
    status: string;
    publishedAt: string;
  }>,
  options?: { skipRevision?: boolean }
) {
  return db.transaction(async (tx) => {
    const current = await tx.select().from(guides).where(eq(guides.id, id)).limit(1);
    
    if (current.length === 0) return null;
    
    if (!options?.skipRevision) {
      await tx.insert(revisions).values({
        contentType: "guide",
        contentId: id,
        revisionData: JSON.stringify(current[0]),
      });
    }
    
    if (data.slug && current[0].slug !== data.slug) {
      await tx.insert(redirects).values({
        oldSlug: current[0].slug,
        newSlug: data.slug,
      }).onConflictDoNothing();
    }
    
    const result = await tx.update(guides)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(guides.id, id))
      .returning();
    
    return result[0];
  });
}

export async function softDeleteGuide(id: number) {
  return db.update(guides)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(guides.id, id));
}

// ============================================
// REVIEWS
// ============================================

export async function getReviews(options?: {
  status?: string;
  limit?: number;
}) {
  const conditions = [isNull(reviews.deletedAt)];
  
  if (options?.status) {
    conditions.push(eq(reviews.status, options.status));
  }
  
  let query = db.select().from(reviews).where(and(...conditions));
  query = query.orderBy(desc(reviews.createdAt));
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  return query;
}

export async function getReviewById(id: number) {
  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getReviewBySlug(slug: string) {
  const result = await db.select().from(reviews)
    .where(and(eq(reviews.slug, slug), isNull(reviews.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function getFeaturedVideo() {
  const result = await db.select().from(videos)
    .where(and(isNull(videos.deletedAt), eq(videos.status, "published"), eq(videos.isFeatured, true)))
    .orderBy(desc(videos.createdAt))
    .limit(1);
  return result[0] ?? null;
}

export async function createReview(data: {
  title: string;
  slug?: string;
  content: string;
  reviewType: string;
  ratingOverall?: number;
  ratingValue?: number;
  ratingQuality?: number;
  ratingComfort?: number;
  ratingFamily?: number;
  pros?: string;
  cons?: string;
  wouldRecommend?: string;
  finalVerdict?: string;
  status?: string;
}) {
  const baseSlug = data.slug || generateSlug(data.title);
  const reviewSlug = await generateUniqueSlug(baseSlug, "review");
  
  const result = await db.insert(reviews).values({
    title: data.title,
    slug: reviewSlug,
    content: data.content,
    reviewType: data.reviewType,
    ratingOverall: data.ratingOverall ?? null,
    ratingValue: data.ratingValue ?? null,
    ratingQuality: data.ratingQuality ?? null,
    ratingComfort: data.ratingComfort ?? null,
    ratingFamily: data.ratingFamily ?? null,
    pros: data.pros ?? null,
    cons: data.cons ?? null,
    wouldRecommend: data.wouldRecommend ?? null,
    finalVerdict: data.finalVerdict ?? null,
    status: data.status || "draft",
  }).returning();
  
  return result[0];
}

export async function updateReview(
  id: number,
  data: Partial<{
    title: string;
    slug: string;
    content: string;
    reviewType: string;
    ratingOverall: number;
    ratingValue: number;
    ratingQuality: number;
    ratingComfort: number;
    ratingFamily: number;
    pros: string;
    cons: string;
    wouldRecommend: string;
    finalVerdict: string;
    status: string;
    publishedAt: string;
  }>,
  options?: { skipRevision?: boolean }
) {
  return db.transaction(async (tx) => {
    const current = await tx.select().from(reviews).where(eq(reviews.id, id)).limit(1);
    
    if (current.length === 0) return null;
    
    if (!options?.skipRevision) {
      await tx.insert(revisions).values({
        contentType: "review",
        contentId: id,
        revisionData: JSON.stringify(current[0]),
      });
    }
    
    if (data.slug && current[0].slug !== data.slug) {
      await tx.insert(redirects).values({
        oldSlug: current[0].slug,
        newSlug: data.slug,
      }).onConflictDoNothing();
    }
    
    const result = await tx.update(reviews)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reviews.id, id))
      .returning();
    
    return result[0];
  });
}

export async function softDeleteReview(id: number) {
  return db.update(reviews)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(reviews.id, id));
}

// ============================================
// TAG ASSOCIATIONS
// ============================================

export async function setPostTags(postId: number, tagIds: number[]) {
  await db.delete(postTags).where(eq(postTags.postId, postId));
  for (const tagId of tagIds) {
    await db.insert(postTags).values({ postId, tagId }).onConflictDoNothing();
  }
}

export async function setGuideTags(guideId: number, tagIds: number[]) {
  await db.delete(guideTags).where(eq(guideTags.guideId, guideId));
  for (const tagId of tagIds) {
    await db.insert(guideTags).values({ guideId, tagId }).onConflictDoNothing();
  }
}

export async function setReviewTags(reviewId: number, tagIds: number[]) {
  await db.delete(reviewTags).where(eq(reviewTags.reviewId, reviewId));
  for (const tagId of tagIds) {
    await db.insert(reviewTags).values({ reviewId, tagId }).onConflictDoNothing();
  }
}

// ============================================
// RELATED CONTENT
// ============================================

export async function addRelatedContent(
  sourceType: string,
  sourceId: number,
  targetType: string,
  targetId: number
) {
  return db.insert(relatedContent).values({
    sourceType,
    sourceId,
    targetType,
    targetId,
  }).onConflictDoNothing();
}

// ============================================
// REVISION HISTORY
// ============================================

export async function getRevisions(contentType: string, contentId: number) {
  return db.select().from(revisions).where(
    and(
      eq(revisions.contentType, contentType),
      eq(revisions.contentId, contentId)
    )
  ).orderBy(desc(revisions.createdAt));
}

export async function restoreRevision(revisionId: number) {
  const revision = await db.select().from(revisions).where(eq(revisions.id, revisionId)).limit(1);
  
  if (revision.length === 0) return null;
  
  const data = JSON.parse(revision[0].revisionData);
  const { contentType, contentId } = revision[0];
  
  if (contentType === "post") {
    return updatePost(contentId, {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      status: data.status,
    }, { skipRevision: true });
  }
  
  if (contentType === "guide") {
    return updateGuide(contentId, {
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      status: data.status,
    }, { skipRevision: true });
  }
  
  if (contentType === "review") {
    return updateReview(contentId, {
      title: data.title,
      content: data.content,
      reviewType: data.reviewType,
      ratingOverall: data.ratingOverall,
      ratingValue: data.ratingValue,
      ratingQuality: data.ratingQuality,
      ratingComfort: data.ratingComfort,
      ratingFamily: data.ratingFamily,
      pros: data.pros,
      cons: data.cons,
      wouldRecommend: data.wouldRecommend,
      finalVerdict: data.finalVerdict,
      status: data.status,
    }, { skipRevision: true });
  }
  
  return null;
}

// ============================================
// TIPTAP TEXT EXTRACTION (for FTS5)
// ============================================

export function extractTextFromTipTap(json: string): string {
  try {
    const doc = JSON.parse(json);
    const texts: string[] = [];
    
    function extractFromNode(node: any) {
      if (node.text) {
        texts.push(node.text);
      }
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          extractFromNode(child);
        }
      }
    }
    
    if (doc.content && Array.isArray(doc.content)) {
      for (const node of doc.content) {
        extractFromNode(node);
      }
    }
    
    return texts.join(" ").trim();
  } catch {
    return "";
  }
}
