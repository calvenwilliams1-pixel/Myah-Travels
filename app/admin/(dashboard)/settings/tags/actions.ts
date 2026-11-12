"use server";

import { requireAuth } from "@/lib/auth";
import { toggleTagFavourite, renameTag } from "@/lib/content";
import { deleteCanonicalSafe, mergeTagsWithAliases, createAlias, removeAlias } from "@/lib/tags/aliases";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function toggleTagFavouriteAction(formData: FormData) {
  await requireAuth();
  const tagId = Number(formData.get("tagId"));
  await toggleTagFavourite(tagId);
  revalidatePath("/admin/settings/tags");
}

export async function deleteTagAction(formData: FormData) {
  await requireAuth();
  const tagId = Number(formData.get("tagId"));
  const result = await deleteCanonicalSafe(tagId);
  revalidatePath("/admin/settings/tags");
  if (result && "error" in result && result.error) {
    redirect(`/admin/settings/tags?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/admin/settings/tags?success=${encodeURIComponent("Tag deleted")}`);
}

export async function renameTagAction(formData: FormData) {
  await requireAuth();
  const tagId = Number(formData.get("tagId"));
  const newName = String(formData.get("newName") || "");
  const result = await renameTag(tagId, newName);
  revalidatePath("/admin/settings/tags");
  if (result && "error" in result && result.error) {
    redirect(`/admin/settings/tags?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/admin/settings/tags?success=${encodeURIComponent("Tag renamed")}`);
}

export async function mergeTagsAction(formData: FormData) {
  await requireAuth();
  const sourceId = Number(formData.get("sourceId"));
  const targetId = Number(formData.get("targetId"));

  if (!sourceId || !targetId) {
    redirect(`/admin/settings/tags?error=${encodeURIComponent("Select a target tag to merge into")}`);
  }

  const result = await mergeTagsWithAliases(sourceId, targetId);
  revalidatePath("/admin/settings/tags");
  if (result && "error" in result && result.error) {
    redirect(`/admin/settings/tags?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/admin/settings/tags?success=${encodeURIComponent("Tag merged")}`);
}

export async function addAliasAction(formData: FormData) {
  await requireAuth();
  const aliasId = Number(formData.get("aliasId"));
  const canonicalId = Number(formData.get("canonicalId"));

  if (!aliasId || !canonicalId) {
    redirect(`/admin/settings/tags?error=${encodeURIComponent("Select a tag to alias")}`);
  }

  const result = await createAlias(aliasId, canonicalId);
  revalidatePath("/admin/settings/tags");
  if (result && "error" in result && result.error) {
    redirect(`/admin/settings/tags?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/admin/settings/tags?success=${encodeURIComponent("Alias created")}`);
}

export async function removeAliasAction(formData: FormData) {
  await requireAuth();
  const aliasId = Number(formData.get("aliasId"));
  const result = await removeAlias(aliasId);
  revalidatePath("/admin/settings/tags");
  if (result && "error" in result && result.error) {
    redirect(`/admin/settings/tags?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/admin/settings/tags?success=${encodeURIComponent("Alias removed")}`);
}
