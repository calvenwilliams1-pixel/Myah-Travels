import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSegmentById, duplicateSegment } from "@/lib/itineraries";
import { recordOperation, OPERATION_TYPES } from "@/lib/operations/record";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const original = await getSegmentById(id);
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const copy = await duplicateSegment(id);
  if (!copy) return NextResponse.json({ error: "Duplicate failed" }, { status: 500 });

  recordOperation(OPERATION_TYPES.DUPLICATE_SEGMENT, [copy.id], { sourceId: id });
  return NextResponse.json({ success: true, segment: copy });
}
