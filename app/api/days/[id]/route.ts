import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateDay, deleteDay } from "@/lib/itineraries";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  await updateDay(id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteDay(id);
  return NextResponse.json({ success: true });
}
