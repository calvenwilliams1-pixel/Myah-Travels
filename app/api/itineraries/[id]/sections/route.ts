import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSectionsForItinerary, createSection } from "@/lib/itineraries";
import { CreateSectionSchema } from "@/lib/validation/itinerary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const itineraryId = Number(params.id);
  if (!itineraryId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const sections = await getSectionsForItinerary(itineraryId);
  return NextResponse.json({ sections });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const itineraryId = Number(params.id);
  if (!itineraryId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateSectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  const result = await createSection(itineraryId, parsed.data);
  return NextResponse.json({ success: true, section: result[0] });
}
