import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { portalItems } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getItineraryById } from "@/lib/itineraries";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const itineraryId = Number(params.id);
  if (!itineraryId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const itinerary = await getItineraryById(itineraryId);
  if (!itinerary) return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });

  const body = await req.json();
  const { portalId } = body;
  if (!portalId) return NextResponse.json({ error: "portalId required" }, { status: 400 });

  const items = await db.select().from(portalItems).where(eq(portalItems.portalId, portalId));
  const nextPosition = items.length > 0 ? Math.max(...items.map(i => i.position ?? 0)) + 1 : 0;

  const result = await db.insert(portalItems).values({
    portalId,
    sourceType: "itinerary",
    itineraryId,
    position: nextPosition,
  }).returning();

  return NextResponse.json({ success: true, portalItemId: result[0].id });
}
