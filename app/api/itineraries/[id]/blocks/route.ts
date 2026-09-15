import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getItineraryById } from "@/lib/itineraries";
import { getBlocksForItinerary, createBlock } from "@/lib/itineraries/blocks";
import { CreateItineraryBlockSchema } from "@/lib/validation/itinerary";
import { getSectionById, getDayById } from "@/lib/itineraries";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const itineraryId = Number(params.id);
  if (!itineraryId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const itinerary = await getItineraryById(itineraryId);
  if (!itinerary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocks = await getBlocksForItinerary(itineraryId);
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const itineraryId = Number(params.id);
  if (!itineraryId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  // Ownership: itinerary must exist and not be soft-deleted
  const itinerary = await getItineraryById(itineraryId);
  if (!itinerary) return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });

  const body = await req.json();
  const parsed = CreateItineraryBlockSchema.safeParse({ ...body, itineraryId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  // Cascade ownership: section or day must belong to this itinerary
  if (parsed.data.sectionId != null) {
    const section = await getSectionById(parsed.data.sectionId);
    if (!section || section.itineraryId !== itineraryId) {
      return NextResponse.json({ error: "Section does not belong to this itinerary" }, { status: 403 });
    }
  }
  if (parsed.data.dayId != null) {
    const day = await getDayById(parsed.data.dayId);
    if (!day) {
      return NextResponse.json({ error: "Day not found" }, { status: 404 });
    }
    const section = await getSectionById(day.sectionId);
    if (!section || section.itineraryId !== itineraryId) {
      return NextResponse.json({ error: "Day does not belong to this itinerary" }, { status: 403 });
    }
  }

  const block = await createBlock(parsed.data);
  return NextResponse.json({ success: true, block });
}
