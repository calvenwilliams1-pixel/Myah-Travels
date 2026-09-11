import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSegmentsForDay, createSegment } from "@/lib/itineraries";
import { CreateSegmentSchema } from "@/lib/validation/itinerary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const dayId = Number(params.id);
  if (!dayId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const segments = await getSegmentsForDay(dayId);
  return NextResponse.json({ segments });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const dayId = Number(params.id);
  if (!dayId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateSegmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  const result = await createSegment(dayId, parsed.data);
  return NextResponse.json({ success: true, segment: result[0] });
}
