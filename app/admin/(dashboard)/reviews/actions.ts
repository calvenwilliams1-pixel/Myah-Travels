"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { createReview, updateReview, getReviewById, softDeleteReview } from "@/lib/content";
import { validateReview } from "@/lib/security";
import { logActivity } from "@/lib/logging";

export async function createReviewAction(data: {
  title: string;
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
  const user = await requireAuth();

  const validation = validateReview({
    title: data.title,
    slug: data.title.toLowerCase().replace(/\s+/g, "-"),
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
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Invalid input" };
  }

  const review = await createReview(data);

  if (!review) {
    return { error: "Failed to create review" };
  }

  await logActivity({
    userId: Number(user.id),
    actionType: "create",
    entityType: "review",
    entityId: review.id,
    details: `Created review: ${review.title}`,
  });

  return { reviewId: review.id };
}

export async function updateReviewAction(
  id: number,
  data: {
    title: string;
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
  }
) {
  const user = await requireAuth();

  const validation = validateReview({
    title: data.title,
    slug: data.title.toLowerCase().replace(/\s+/g, "-"),
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
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Invalid input" };
  }

  const review = await updateReview(id, {
    ...data,
    publishedAt: data.status === "published" ? new Date().toISOString() : undefined,
  });

  if (!review) {
    return { error: "Failed to update review" };
  }

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "review",
    entityId: id,
    details: `Updated review: ${review.title}`,
  });

  return { success: true };
}

export async function getReviewAction(id: number) {
  await requireAuth();
  return getReviewById(id);
}

export async function deleteReviewAction(id: number) {
  const user = await requireAuth();
  await softDeleteReview(id);

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "review",
    entityId: id,
    details: "Soft deleted review",
  });

  redirect("/admin/reviews");
}
