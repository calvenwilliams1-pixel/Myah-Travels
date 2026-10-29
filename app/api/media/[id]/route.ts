import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function PATCH(
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

    if (typeof body?.isLibrary !== "boolean") {
      return NextResponse.json(
        { error: "isLibrary must be a boolean" },
        { status: 400 }
      );
    }

    const existing = await db
      .select({ id: media.id })
      .from(media)
      .where(and(eq(media.id, id), isNull(media.deletedAt)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db
      .update(media)
      .set({ isLibrary: body.isLibrary })
      .where(eq(media.id, id));

    return NextResponse.json({ id, isLibrary: body.isLibrary });
  } catch (error) {
    console.error("PATCH /api/media/[id] failed:", error);
    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}
