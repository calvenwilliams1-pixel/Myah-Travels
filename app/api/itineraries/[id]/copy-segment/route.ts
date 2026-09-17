import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getItineraryById,
  getDayById,
  getSectionById,
  getSegmentById,
  copySegmentToDay,
} from "@/lib/itineraries";
import { recordOperation, OPERATION_TYPES } from "@/lib/operations/record";

// SECURITY: Single-admin system — requireAuth() only.
// Note: the [id] param is the target itinerary ID. Copying happens
// from sourceSegmentId (in body) into targetDayId (in body), both of
// which are validated against the target itinerary below.

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const targetItineraryId = Number(params.id);
  if (!targetItineraryId) return NextResponse.json({ error: "Invalid target ID" }, { status: 400 });

  const body = await req.json();
  const sourceSegmentId = Number(body?.sourceSegmentId);
  const targetDayId = Number(body?.targetDayId);

  if (!sourceSegmentId || !targetDayId) {
    return NextResponse.json({ error: "sourceSegmentId and targetDayId required" }, { status: 400 });
  }

  // Ownership: target itinerary must exist
  const targetItinerary = await getItineraryById(targetItineraryId);
  if (!targetItinerary) return NextResponse.json({ error: "Target itinerary not found" }, { status: 404 });

  // Ownership: target day must belong to target itinerary
  const targetDay = await getDayById(targetDayId);
  if (!targetDay) return NextResponse.json({ error: "Target day not found" }, { status: 404 });
  const targetSection = await getSectionById(targetDay.sectionId);
  if (!targetSection || targetSection.itineraryId !== targetItineraryId) {
    return NextResponse.json({ error: "Target day does not belong to target itinerary" }, { status: 403 });
  }

  // Source must exist (any itinerary — cross-copy is the whole point)
  const source = await getSegmentById(sourceSegmentId);
  if (!source) return NextResponse.json({ error: "Source segment not found" }, { status: 404 });

  const copy = await copySegmentToDay(sourceSegmentId, targetDayId);
  if (!copy) return NextResponse.json({ error: "Copy failed" }, { status: 500 });

  recordOperation(OPERATION_TYPES.COPY_ACROSS_ITINERARIES, [copy.id], {
    sourceId: sourceSegmentId,
    targetItineraryId,
    targetDayId,
  });
  return NextResponse.json({ success: true, segment: copy });
}
