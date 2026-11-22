import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { moveFileToFolder } from "@/lib/folders";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) { try {
  try {
    await requireAuth();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch (authErr) { if (authErr instanceof AuthError) { return NextResponse.json({ error: authErr.message }, { status: authErr.status }); } 
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const folderId = body?.folderId;
    if (folderId !== null && typeof folderId !== "number") {
      return NextResponse.json({ error: "folderId must be a number or null" }, { status: 400 });
    }

    try {
      await moveFileToFolder(id, folderId);
      return NextResponse.json({ success: true, id, folderId });
    } catch (err: any) { if (err instanceof AuthError) { return NextResponse.json({ error: err.message }, { status: err.status }); } 
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } 
    console.error("POST /api/media/[id]/move failed:", e);
    return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
  }
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
