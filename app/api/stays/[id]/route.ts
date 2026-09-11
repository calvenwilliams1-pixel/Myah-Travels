import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateStay, deleteStay } from "@/lib/itineraries";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  await updateStay(id, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteStay(id);
  return NextResponse.json({ success: true });
}
