import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDayById, reorderSegments, resetSegmentOrder } from "@/lib/itineraries";
import { recordOperation, OPERATION_TYPES } from "@/lib/operations/record";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const dayId = Number(params.id);
  if (!dayId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const day = await getDayById(dayId);
  if (!day) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const segmentIds = body?.segmentIds;
  if (!Array.isArray(segmentIds) || segmentIds.some((x) => typeof x !== "number")) {
    return NextResponse.json({ error: "segmentIds must be an array of numbers" }, { status: 400 });
  }

  const result = await reorderSegments(dayId, segmentIds);
  if (!result) return NextResponse.json({ error: "Reorder failed" }, { status: 500 });

  recordOperation(OPERATION_TYPES.DRAG_REORDER, [dayId], { segmentIds });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const dayId = Number(params.id);
  if (!dayId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const day = await getDayById(dayId);
  if (!day) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await resetSegmentOrder(dayId);
  if (!result) return NextResponse.json({ error: "Reset failed" }, { status: 500 });

  recordOperation(OPERATION_TYPES.RESET_ORDER, [dayId], {});
  return NextResponse.json({ success: true });
}
