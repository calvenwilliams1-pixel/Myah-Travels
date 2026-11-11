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
import { eq, and, desc, isNull, isNotNull, sql } from "drizzle-orm";

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

export function normaliseTagName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export async function getAllTags() {
  return db.select().from(tags).orderBy(tags.name);
}

export async function getTagBySlug(slug: string) {
  const result = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function getOrCreateTag(name: string, dbOrTx: typeof db = db) {
  const slug = normaliseTagName(name);
  if (!slug) return null;

  const existing = await dbOrTx.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }

  const created = await dbOrTx.insert(tags).values({
    name: name.trim(),
    slug,
  }).returning();

  return created[0] ?? null;
}

export async function getAllTagsWithCounts() {
  const result = await db.select({
    id: tags.id,
    name: tags.name,
    slug: tags.slug,
    isFavourite: tags.isFavourite,
    lastUsedAt: tags.lastUsedAt,
    usageCount: sql<number>`(
      (SELECT COUNT(*) FROM post_tags pt
        INNER JOIN posts p ON p.id = pt.post_id
        WHERE pt.tag_id = tags.id AND p.status = 'published' AND p.deleted_at IS NULL)
      + (SELECT COUNT(*) FROM guide_tags gt
        INNER JOIN guides g ON g.id = gt.guide_id
        WHERE gt.tag_id = tags.id AND g.status = 'published' AND g.deleted_at IS NULL)
      + (SELECT COUNT(*) FROM review_tags rt
        INNER JOIN reviews r ON r.id = rt.review_id
        WHERE rt.tag_id = tags.id AND r.status = 'published' AND r.deleted_at IS NULL)
    )`.as("usage_count"),
  })
  .from(tags)
  .orderBy(desc(tags.lastUsedAt), tags.name);

  return result;
}

export async function getTagSuggestions(query: string) {
  const slugQuery = normaliseTagName(query);
  
  return db.select()
    .from(tags)
    .where(sql`lower(${tags.slug}) LIKE ${"%" + slugQuery + "%"}`)
    .orderBy(desc(tags.isFavourite), desc(tags.lastUsedAt), tags.name)
    .limit(10);
}

export async function toggleTagFavourite(tagId: number) {
  const tag = await db.select().from(tags).where(eq(tags.id, tagId)).limit(1);
  if (tag.length === 0) return null;
  
  const updated = await db.update(tags)
    .set({ isFavourite: !(tag[0].isFavourite ?? false) })
    .where(eq(tags.id, tagId))
    .returning();
  
  return updated[0];
}

export async function renameTag(tagId: number, newName: string) {
  const newSlug = normaliseTagName(newName);
  if (!newSlug) return { error: "Invalid tag name" };

  const existing = await db.select().from(tags)
    .where(and(eq(tags.slug, newSlug), sql`${tags.id} != ${tagId}`))
    .limit(1);

  if (existing.length > 0) {
    return { error: `Tag "${newName.trim()}" already exists` };
  }

  try {
    let updated: any = null;
    db.transaction((tx) => {
      updated = tx.update(tags)
        .set({ name: newName.trim(), slug: newSlug })
        .where(eq(tags.id, tagId))
        .returning()
        .all();
    });
    return { success: true, tag: updated?.[0] };
  } catch (err) {
    console.error("renameTag failed:", err);
    return { error: "Failed to rename tag" };
  }
}

export async function mergeTags(sourceId: number, targetId: number) {
  if (sourceId === targetId) return { error: "Cannot merge tag into itself" };

  const source = await db.select().from(tags).where(eq(tags.id, sourceId)).limit(1);
  if (source.length === 0) return { error: "Source tag not found" };
  const target = await db.select().from(tags).where(eq(tags.id, targetId)).limit(1);
  if (target.length === 0) return { error: "Target tag not found" };

  try {
    db.transaction((tx) => {
      // Repoint post_tags
      const postAssocs = tx.select().from(postTags).where(eq(postTags.tagId, sourceId)).all();
      for (const a of postAssocs) {
        tx.insert(postTags).values({ postId: a.postId, tagId: targetId }).onConflictDoNothing().run();
      }
      tx.delete(postTags).where(eq(postTags.tagId, sourceId)).run();

      // Repoint guide_tags
      const guideAssocs = tx.select().from(guideTags).where(eq(guideTags.tagId, sourceId)).all();
      for (const a of guideAssocs) {
        tx.insert(guideTags).values({ guideId: a.guideId, tagId: targetId }).onConflictDoNothing().run();
      }
      tx.delete(guideTags).where(eq(guideTags.tagId, sourceId)).run();

      // Repoint review_tags
      const reviewAssocs = tx.select().from(reviewTags).where(eq(reviewTags.tagId, sourceId)).all();
      for (const a of reviewAssocs) {
        tx.insert(reviewTags).values({ reviewId: a.reviewId, tagId: targetId }).onConflictDoNothing().run();
      }
      tx.delete(reviewTags).where(eq(reviewTags.tagId, sourceId)).run();

      // Finally delete the source tag
      tx.delete(tags).where(eq(tags.id, sourceId)).run();
    });
    return { success: true };
  } catch (err) {
    console.error("mergeTags failed:", err);
    return { error: "Failed to merge tags" };
  }
}

export async function deleteTag(tagId: number) {
  const postUsage = await db.select().from(postTags).where(eq(postTags.tagId, tagId));
  const guideUsage = await db.select().from(guideTags).where(eq(guideTags.tagId, tagId));
  const reviewUsage = await db.select().from(reviewTags).where(eq(reviewTags.tagId, tagId));

  const totalUsage = postUsage.length + guideUsage.length + reviewUsage.length;
  if (totalUsage > 0) {
    const parts = [];
    if (postUsage.length > 0) parts.push(`${postUsage.length} post${postUsage.length === 1 ? "" : "s"}`);
    if (guideUsage.length > 0) parts.push(`${guideUsage.length} guide${guideUsage.length === 1 ? "" : "s"}`);
    if (reviewUsage.length > 0) parts.push(`${reviewUsage.length} review${reviewUsage.length === 1 ? "" : "s"}`);
    return { error: `Tag is used by ${parts.join(", ")}` };
  }

  try {
    db.transaction((tx) => {
      tx.delete(tags).where(eq(tags.id, tagId)).run();
    });
    return { success: true };
  } catch (err) {
    console.error("deleteTag failed:", err);
    return { error: "Failed to delete tag" };
  }
}

export async function getPostTags(postId: number): Promise<string[]> {
  const result = await db.select({ name: tags.name })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, postId));
  
  return result.map((r) => r.name);
}

export async function getGuideTags(guideId: number): Promise<string[]> {
  const result = await db.select({ name: tags.name })
    .from(guideTags)
    .innerJoin(tags, eq(guideTags.tagId, tags.id))
    .where(eq(guideTags.guideId, guideId));

  return result.map((r) => r.name);
}

export async function getReviewTags(reviewId: number): Promise<string[]> {
  const result = await db.select({ name: tags.name })
    .from(reviewTags)
    .innerJoin(tags, eq(reviewTags.tagId, tags.id))
    .where(eq(reviewTags.reviewId, reviewId));

  return result.map((r) => r.name);
}

export async function updatePostTags(postId: number, tagNames: string[]) {
  // Resolve tags first (outside transaction — getOrCreateTag is async + needs db)
  const resolved: number[] = [];
  for (const name of tagNames) {
    const tag = await getOrCreateTag(name);
    if (tag) resolved.push(tag.id);
  }

  const now = new Date().toISOString();
  try {
    db.transaction((tx) => {
      tx.delete(postTags).where(eq(postTags.postId, postId)).run();
      for (const tagId of resolved) {
        tx.insert(postTags).values({ postId, tagId }).onConflictDoNothing().run();
        tx.update(tags).set({ lastUsedAt: now }).where(eq(tags.id, tagId)).run();
      }
    });
  } catch (err) {
    console.error("updatePostTags failed:", err);
    throw err;
  }
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
  
  let query: any = db.select().from(posts);
  
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
  mode?: "story" | "design";
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
    mode: data.mode || "story",
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
  const current = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  
  if (current.length === 0) return null;
  
  if (!options?.skipRevision) {
    await db.insert(revisions).values({
      contentType: "post",
      contentId: id,
      revisionData: JSON.stringify(current[0]),
    });
  }
  
  if (data.slug && current[0].slug !== data.slug) {
    await db.insert(redirects).values({
      oldSlug: current[0].slug,
      newSlug: data.slug,
    }).onConflictDoNothing();
  }
  
  const result = await db.update(posts)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, id))
    .returning();
  
  return result[0];
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
  
  let query: any = db.select().from(guides).where(and(...conditions));
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
  mode?: "story" | "design";
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
    mode: data.mode || "story",
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
  const current = await db.select().from(guides).where(eq(guides.id, id)).limit(1);
  
  if (current.length === 0) return null;
  
  if (!options?.skipRevision) {
    await db.insert(revisions).values({
      contentType: "guide",
      contentId: id,
      revisionData: JSON.stringify(current[0]),
    });
  }
  
  if (data.slug && current[0].slug !== data.slug) {
    await db.insert(redirects).values({
      oldSlug: current[0].slug,
      newSlug: data.slug,
    }).onConflictDoNothing();
  }
  
  const result = await db.update(guides)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(guides.id, id))
    .returning();
  
  return result[0];
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
  
  let query: any = db.select().from(reviews).where(and(...conditions));
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
  mode?: "story" | "design";
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
    mode: data.mode || "story",
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
  const current = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  
  if (current.length === 0) return null;
  
  if (!options?.skipRevision) {
    await db.insert(revisions).values({
      contentType: "review",
      contentId: id,
      revisionData: JSON.stringify(current[0]),
    });
  }
  
  if (data.slug && current[0].slug !== data.slug) {
    await db.insert(redirects).values({
      oldSlug: current[0].slug,
      newSlug: data.slug,
    }).onConflictDoNothing();
  }
  
  const result = await db.update(reviews)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(reviews.id, id))
    .returning();
  
  return result[0];
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
  try {
    db.transaction((tx) => {
      tx.delete(postTags).where(eq(postTags.postId, postId)).run();
      for (const tagId of tagIds) {
        tx.insert(postTags).values({ postId, tagId }).onConflictDoNothing().run();
      }
    });
  } catch (err) {
    console.error("setPostTags failed:", err);
    throw err;
  }
}

export async function setGuideTags(guideId: number, tagIds: number[]) {
  try {
    db.transaction((tx) => {
      tx.delete(guideTags).where(eq(guideTags.guideId, guideId)).run();
      for (const tagId of tagIds) {
        tx.insert(guideTags).values({ guideId, tagId }).onConflictDoNothing().run();
      }
    });
  } catch (err) {
    console.error("setGuideTags failed:", err);
    throw err;
  }
}

export async function setReviewTags(reviewId: number, tagIds: number[]) {
  try {
    db.transaction((tx) => {
      tx.delete(reviewTags).where(eq(reviewTags.reviewId, reviewId)).run();
      for (const tagId of tagIds) {
        tx.insert(reviewTags).values({ reviewId, tagId }).onConflictDoNothing().run();
      }
    });
  } catch (err) {
    console.error("setReviewTags failed:", err);
    throw err;
  }
}

export async function updateGuideTags(guideId: number, tagNames: string[]) {
  const resolved: number[] = [];
  for (const name of tagNames) {
    const tag = await getOrCreateTag(name);
    if (tag) resolved.push(tag.id);
  }

  const now = new Date().toISOString();
  try {
    db.transaction((tx) => {
      tx.delete(guideTags).where(eq(guideTags.guideId, guideId)).run();
      for (const tagId of resolved) {
        tx.insert(guideTags).values({ guideId, tagId }).onConflictDoNothing().run();
        tx.update(tags).set({ lastUsedAt: now }).where(eq(tags.id, tagId)).run();
      }
    });
  } catch (err) {
    console.error("updateGuideTags failed:", err);
    throw err;
  }
}

export async function updateReviewTags(reviewId: number, tagNames: string[]) {
  const resolved: number[] = [];
  for (const name of tagNames) {
    const tag = await getOrCreateTag(name);
    if (tag) resolved.push(tag.id);
  }

  const now = new Date().toISOString();
  try {
    db.transaction((tx) => {
      tx.delete(reviewTags).where(eq(reviewTags.reviewId, reviewId)).run();
      for (const tagId of resolved) {
        tx.insert(reviewTags).values({ reviewId, tagId }).onConflictDoNothing().run();
        tx.update(tags).set({ lastUsedAt: now }).where(eq(tags.id, tagId)).run();
      }
    });
  } catch (err) {
    console.error("updateReviewTags failed:", err);
    throw err;
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
