import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getFullItinerary, updateItinerary, softDeleteItinerary } from "@/lib/itineraries";
import { getPortalById } from "@/lib/portal";
import { UpdateItinerarySchema } from "@/lib/validation/itinerary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const itinerary = await getFullItinerary(id);
  if (!itinerary) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const portal = await getPortalById(itinerary.portalId);

  return NextResponse.json({
    itinerary,
    portal: portal
      ? {
          id: portal.id,
          name: portal.name,
          slug: portal.slug,
          departureDate: portal.departureDate,
          returnDate: portal.returnDate,
        }
      : null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = UpdateItinerarySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  await updateItinerary(id, parsed.data);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await softDeleteItinerary(id);
  return NextResponse.json({ success: true });
}
