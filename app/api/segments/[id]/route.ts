import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateSegment, deleteSegment } from "@/lib/itineraries";
import { recordSegmentFields } from "@/lib/suggestions/record";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  await updateSegment(id, body);
  void recordSegmentFields({
    title: body.title,
    location: body.location,
    referenceLabel: body.referenceLabel,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteSegment(id);
  return NextResponse.json({ success: true });
}
