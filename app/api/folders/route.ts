import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getFolderTree, createFolder, getFolderById } from "@/lib/folders";

export async function GET() { try {
  try {
    await requireAuth();
    const tree = await getFolderTree();
    return NextResponse.json({ tree });
  } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } 
    console.error("GET /api/folders failed:", e);
    return NextResponse.json({ error: "Failed to load folders" }, { status: 500 });
  }
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function POST(req: NextRequest) { try {
  try {
    await requireAuth();

    let body: any;
    try {
      body = await req.json();
    } catch (authErr) { if (authErr instanceof AuthError) { return NextResponse.json({ error: authErr.message }, { status: authErr.status }); } 
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "name too long" }, { status: 400 });
    }

    let parentId: number | null = null;
    if (body.parentId !== undefined && body.parentId !== null) {
      if (typeof body.parentId !== "number") {
        return NextResponse.json({ error: "parentId must be a number or null" }, { status: 400 });
      }
      const parent = await getFolderById(body.parentId);
      if (!parent) {
        return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
      }
      parentId = body.parentId;
    }

    const created = await createFolder({ name, parentId });
    return NextResponse.json({ folder: created[0] });
  } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } 
    console.error("POST /api/folders failed:", e);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
