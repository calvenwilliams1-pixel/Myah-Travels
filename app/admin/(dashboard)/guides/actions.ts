"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createGuide, updateGuide, getGuideById, softDeleteGuide } from "@/lib/content";
import { validateGuide } from "@/lib/security";
import { logActivity } from "@/lib/logging";

export async function createGuideAction(data: {
  title: string;
  content: string;
  excerpt?: string;
  quickReference?: string;
  status?: string;
  mode?: string;
}) {
  const user = await requireAuth();

  const validation = validateGuide({
    title: data.title,
    slug: data.title.toLowerCase().replace(/\s+/g, "-"),
    content: data.content,
    excerpt: data.excerpt,
    status: data.status,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Invalid input" };
  }

  const guide = await createGuide({
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    quickReference: data.quickReference,
    status: data.status,
    mode: (data.mode || "story") as "story" | "design",
  });

  if (!guide) {
    return { error: "Failed to create guide" };
  }

  await logActivity({
    userId: Number(user.id),
    actionType: "create",
    entityType: "guide",
    entityId: guide.id,
    details: `Created guide: ${guide.title}`,
  });

  return { guideId: guide.id };
}

export async function updateGuideAction(
  id: number,
  data: {
    title: string;
    content: string;
    excerpt?: string;
    quickReference?: string;
    status?: string;
  }
) {
  const user = await requireAuth();

  const validation = validateGuide({
    title: data.title,
    slug: data.title.toLowerCase().replace(/\s+/g, "-"),
    content: data.content,
    excerpt: data.excerpt,
    status: data.status,
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Invalid input" };
  }

  const guide = await updateGuide(id, {
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    quickReference: data.quickReference,
    status: data.status,
    publishedAt: data.status === "published" ? new Date().toISOString() : undefined,
  });

  if (!guide) {
    return { error: "Failed to update guide" };
  }

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "guide",
    entityId: id,
    details: `Updated guide: ${guide.title}`,
  });

  return { success: true };
}

export async function getGuideAction(id: number) {
  await requireAuth();
  return getGuideById(id);
}

export async function deleteGuideAction(id: number) {
  const user = await requireAuth();
  await softDeleteGuide(id);

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "guide",
    entityId: id,
    details: "Soft deleted guide",
  });

  redirect("/admin/guides");
}
