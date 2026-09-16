import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDayById, createSegmentsBulk } from "@/lib/itineraries";
import { BulkAddRequestSchema } from "@/lib/validation/itinerary";
import { recordSegmentFields, recordLegFields } from "@/lib/suggestions/record";
import { recordOperation, OPERATION_TYPES } from "@/lib/operations/record";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const dayId = Number(params.id);
  if (!dayId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const day = await getDayById(dayId);
  if (!day) return NextResponse.json({ error: "Day not found" }, { status: 404 });

  const body = await req.json();
  const parsed = BulkAddRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.errors },
      { status: 400 }
    );
  }

  try {
    const ids = await createSegmentsBulk(dayId, parsed.data.segments);

    // Fire-and-forget recording — never blocks the response
    for (let i = 0; i < parsed.data.segments.length; i++) {
      const s = parsed.data.segments[i];
      void recordSegmentFields({
        title: s.title,
        location: s.location,
      });
      if (s.leg) {
        void recordLegFields({
          origin: s.leg.origin,
          destination: s.leg.destination,
          operator: s.leg.operator,
          identifier: s.leg.identifier,
        });
      }
    }

    recordOperation(OPERATION_TYPES.BULK_ADD, ids, { dayId, count: ids.length });

    return NextResponse.json({ success: true, segmentIds: ids });
  } catch (err) {
    // Transaction rolled back — nothing was committed
    return NextResponse.json(
      { error: "Bulk insert failed", details: String(err) },
      { status: 500 }
    );
  }
}
