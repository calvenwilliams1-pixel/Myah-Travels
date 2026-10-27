"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createPost, updatePost, getPostById, softDeletePost, updatePostTags, getPostTags } from "@/lib/content";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { validatePost } from "@/lib/security";
import { validateRequiredBlocks } from "@/lib/blocks/validate";
import { getEditorTemplates } from "@/lib/blocks/template-store";
import { logActivity } from "@/lib/logging";

export async function createPostAction(formData: FormData) {
  const data = {
    title: String(formData.get("title") || ""),
    content: String(formData.get("content") || ""),
    excerpt: String(formData.get("excerpt") || ""),
    status: String(formData.get("status") || "draft"),
    mode: "story",
    tagNames: JSON.parse(String(formData.get("tagNames") || "[]")),
  };

  const user = await requireAuth();

  const validation = validatePost({
    title: data.title,
    slug: data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-"),
    content: data.content,
    excerpt: data.excerpt,
    status: data.status,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Invalid input" };
  }

  const post = await createPost({
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    status: data.status,
    mode: (data.mode || "story") as "story" | "design",
  });

  if (!post) {
    return { error: "Failed to create post" };
  }

  if (data.tagNames && data.tagNames.length > 0) {
    await updatePostTags(post.id, data.tagNames);
  }

  await logActivity({
    userId: Number(user.id),
    actionType: "create",
    entityType: "post",
    entityId: post.id,
    details: `Created post: ${post.title}`,
  });

  return { postId: post.id };
}

export async function updatePostAction(
  id: number,
  data: {
    title: string;
    content: string;
    excerpt?: string;
    status?: string;
    tagNames?: string[];
  }
) {
  const user = await requireAuth();

  const validation = validatePost({
    title: data.title,
    slug: data.title.toLowerCase().replace(/\s+/g, "-"),
    content: data.content,
    excerpt: data.excerpt,
    status: data.status,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Invalid input" };
  }

  // Publish validation: all required blocks must be present and non-empty
  if (data.status === "published") {
    try {
      const parsed = JSON.parse(data.content);
      const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
      const templateId = parsed?.templateId ?? "story";
      const templates = await getEditorTemplates();
      const template = templates.find((t) => t.id === templateId) ?? null;
      const missing = validateRequiredBlocks(blocks, template);
      if (missing.length > 0) {
        return {
          error: `Cannot publish — required blocks are empty: ${missing.join(", ")}`,
        };
      }
    } catch {
      // Content not block-shaped — skip block validation, let base validation handle it
    }
  }

  const post = await updatePost(id, {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    status: data.status,
    publishedAt: data.status === "published" ? new Date().toISOString() : undefined,
  });

  if (!post) {
    return { error: "Failed to update post" };
  }

  if (data.tagNames) {
    await updatePostTags(id, data.tagNames);
  }

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "post",
    entityId: id,
    details: `Updated post: ${post.title}`,
  });

  return { success: true };
}

export async function getPostAction(id: number) {
  await requireAuth();
  return getPostById(id);
}

export async function getPostTagsAction(postId: number) {
  await requireAuth();
  return getPostTags(postId);
}

export async function restorePostAction(id: number) {
  await requireAuth();
  const db = await import("@/lib/db");
  await db.db.update(posts).set({ deletedAt: null }).where(eq(posts.id, id));
  redirect("/admin/posts");
}

export async function deletePostAction(id: number) {
  const user = await requireAuth();
  await softDeletePost(id);

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "post",
    entityId: id,
    details: "Soft deleted post",
  });

  redirect("/admin/posts");
}
