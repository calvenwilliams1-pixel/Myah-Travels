import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getSegmentsForDay, createSegment } from "@/lib/itineraries";
import { CreateSegmentSchema } from "@/lib/validation/itinerary";
import { recordSegmentFields } from "@/lib/suggestions/record";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const dayId = Number(params.id);
  if (!dayId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const segments = await getSegmentsForDay(dayId);
  return NextResponse.json({ segments });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const dayId = Number(params.id);
  if (!dayId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateSegmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  const result = await createSegment(dayId, parsed.data);
  void recordSegmentFields({
    title: parsed.data.title,
    location: parsed.data.location,
    referenceLabel: parsed.data.referenceLabel,
  });
  return NextResponse.json({ success: true, segment: result[0] });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
