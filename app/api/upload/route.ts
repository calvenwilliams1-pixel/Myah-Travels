import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { saveFile, addMediaRecord } from "@/lib/media";
import { logActivity } from "@/lib/logging";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "general";
    const altText = (formData.get("altText") as string) || "";
    const caption = (formData.get("caption") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const result = await saveFile(file, folder);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
      details: `Uploaded via API: ${file.name}`,
    });

    return NextResponse.json({
      success: true,
      mediaId: record[0]?.id,
      filePath: result.filePath,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
