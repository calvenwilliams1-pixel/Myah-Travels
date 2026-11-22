import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getFolderById, renameFolder, moveFolder, softDeleteFolder } from "@/lib/folders";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) { try {
  try {
    await requireAuth();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const existing = await getFolderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch (authErr) { if (authErr instanceof AuthError) { return NextResponse.json({ error: authErr.message }, { status: authErr.status }); } 
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
      }
      if (name.length > 100) {
        return NextResponse.json({ error: "name too long" }, { status: 400 });
      }
      await renameFolder(id, name);
    }

    if (body.parentId !== undefined) {
      if (body.parentId !== null && typeof body.parentId !== "number") {
        return NextResponse.json({ error: "parentId must be a number or null" }, { status: 400 });
      }
      try {
        await moveFolder(id, body.parentId);
      } catch (err: any) { if (err instanceof AuthError) { return NextResponse.json({ error: err.message }, { status: err.status }); } 
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } 
    console.error("PATCH /api/folders/[id] failed:", e);
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 });
  }
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) { try {
  try {
    await requireAuth();

    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const existing = await getFolderById(id);
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await softDeleteFolder(id);
    return NextResponse.json({ success: true, id });
  } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } 
    console.error("DELETE /api/folders/[id] failed:", e);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
