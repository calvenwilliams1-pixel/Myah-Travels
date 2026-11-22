import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { softDeleteLibraryItem } from "@/lib/content-library";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { try {
  const user = await requireAuth();

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await softDeleteLibraryItem(id);

  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
