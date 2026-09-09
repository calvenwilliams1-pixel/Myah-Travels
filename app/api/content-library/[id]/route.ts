import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { softDeleteLibraryItem } from "@/lib/content-library";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await softDeleteLibraryItem(id);

  return NextResponse.json({ success: true });
}
