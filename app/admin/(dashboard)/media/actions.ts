"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { saveFile, addMediaRecord, softDeleteMedia, updateMediaRecord } from "@/lib/media";
import { logActivity } from "@/lib/logging";

export async function uploadMediaAction(formData: FormData) {
  const user = await requireAuth();

  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "general";
  const altText = (formData.get("altText") as string) || "";
  const caption = (formData.get("caption") as string) || "";

  if (!file) {
    return { error: "No file provided" };
  }

  const result = await saveFile(file, folder);

  if (!result.success) {
    return { error: result.error || "Upload failed" };
  }

  const record = await addMediaRecord({
    filePath: result.filePath!,
    fileName: file.name,
    fileType: result.fileType || file.type,
    fileSize: file.size,
    folder,
    altText,
    caption,
  });

  await logActivity({
    userId: Number(user.id),
    actionType: "upload",
    entityType: "media",
    entityId: record[0]?.id,
    details: `Uploaded: ${file.name}`,
  });

  revalidatePath("/admin/media");
  return { success: true, mediaId: record[0]?.id };
}

export async function deleteMediaAction(formData: FormData) {
  const user = await requireAuth();

  const id = Number(formData.get("id"));

  if (!id) {
    return { error: "No media ID provided" };
  }

  const result = await softDeleteMedia(id);

  if (!result.success) {
    return { error: result.error };
  }

  await logActivity({
    userId: Number(user.id),
    actionType: "delete",
    entityType: "media",
    entityId: id,
    details: "Soft deleted media",
  });

  revalidatePath("/admin/media");
  return { success: true };
}

export async function updateMediaAction(
  id: number,
  data: { altText?: string; caption?: string; folder?: string }
) {
  const user = await requireAuth();

  await updateMediaRecord(id, data);

  await logActivity({
    userId: Number(user.id),
    actionType: "update",
    entityType: "media",
    entityId: id,
    details: "Updated media metadata",
  });

  revalidatePath("/admin/media");
  return { success: true };
}
