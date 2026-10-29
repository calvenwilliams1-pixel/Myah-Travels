import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { moveFileToFolder } from "@/lib/folders";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const folderId = body?.folderId;
    if (folderId !== null && typeof folderId !== "number") {
      return NextResponse.json({ error: "folderId must be a number or null" }, { status: 400 });
    }

    try {
      await moveFileToFolder(id, folderId);
      return NextResponse.json({ success: true, id, folderId });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (e) {
    console.error("POST /api/media/[id]/move failed:", e);
    return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
  }
}
