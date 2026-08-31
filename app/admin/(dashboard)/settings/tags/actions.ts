"use server";

import { requireAuth } from "@/lib/auth";
import { toggleTagFavourite, deleteTag, renameTag, mergeTags } from "@/lib/content";
import { revalidatePath } from "next/cache";

export async function toggleTagFavouriteAction(formData: FormData) {
  await requireAuth();
  const tagId = Number(formData.get("tagId"));
  await toggleTagFavourite(tagId);
  revalidatePath("/admin/settings/tags");
}

export async function deleteTagAction(formData: FormData) {
  await requireAuth();
  const tagId = Number(formData.get("tagId"));
  await deleteTag(tagId);
  revalidatePath("/admin/settings/tags");
}

export async function renameTagAction(formData: FormData) {
  await requireAuth();
  const tagId = Number(formData.get("tagId"));
  const newName = String(formData.get("newName") || "");
  await renameTag(tagId, newName);
  revalidatePath("/admin/settings/tags");
}

export async function mergeTagsAction(formData: FormData) {
  await requireAuth();
  const sourceId = Number(formData.get("sourceId"));
  const targetId = Number(formData.get("targetId"));
  
  if (!sourceId || !targetId) return;
  
  await mergeTags(sourceId, targetId);
  revalidatePath("/admin/settings/tags");
}
