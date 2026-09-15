import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getLegsForSegment, createLeg } from "@/lib/itineraries/travelLegs";
import { CreateLegSchema } from "@/lib/validation/itinerary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const segmentId = Number(params.id);
  if (!segmentId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const legs = await getLegsForSegment(segmentId);
  return NextResponse.json({ legs });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const segmentId = Number(params.id);
  if (!segmentId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateLegSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const result = await createLeg(segmentId, parsed.data);
  return NextResponse.json({ success: true, leg: result[0] });
}
