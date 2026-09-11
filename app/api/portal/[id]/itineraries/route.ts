import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getItinerariesForPortal, createItinerary } from "@/lib/itineraries";
import { CreateItinerarySchema } from "@/lib/validation/itinerary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const list = await getItinerariesForPortal(portalId);
  return NextResponse.json({ itineraries: list });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateItinerarySchema.safeParse({ ...body, portalId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const result = await createItinerary(portalId, parsed.data.title);
  return NextResponse.json({ success: true, itinerary: result[0] });
}
