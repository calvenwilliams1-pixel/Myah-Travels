"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createPost, updatePost, getPostById, softDeletePost } from "@/lib/content";
import { validatePost } from "@/lib/security";
import { logActivity } from "@/lib/logging";

export async function createPostAction(data: {
  title: string;
  content: string;
  excerpt?: string;
  status?: string;
  mode?: string;
}) {
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

  const post = await createPost({
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    status: data.status,
    mode: data.mode || "story",
  });

  if (!post) {
    return { error: "Failed to create post" };
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
