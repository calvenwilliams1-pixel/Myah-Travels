import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { deleteEntity } from "@/lib/suggestions/entities";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  await deleteEntity(id);
  return NextResponse.json({ success: true });
}
