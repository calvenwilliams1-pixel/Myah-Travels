import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { portalItems } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { getItineraryById } from "@/lib/itineraries";

const VALID_VIEW_TYPES = ["full", "glance", "today"] as const;
type ViewType = (typeof VALID_VIEW_TYPES)[number];

const SOURCE_TYPE_MAP: Record<ViewType, string> = {
  full: "itinerary",
  glance: "itinerary_glance",
  today: "itinerary_today",
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const itineraryId = Number(params.id);
  if (!itineraryId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const itinerary = await getItineraryById(itineraryId);
  if (!itinerary) return NextResponse.json({ error: "Itinerary not found" }, { status: 404 });

  const body = await req.json();
  const { portalId, viewType = "full" } = body;
  if (!portalId) return NextResponse.json({ error: "portalId required" }, { status: 400 });
  if (!VALID_VIEW_TYPES.includes(viewType)) {
    return NextResponse.json(
      { error: `viewType must be one of: ${VALID_VIEW_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const sourceType = SOURCE_TYPE_MAP[viewType as ViewType];

  // Block duplicate: same (portalId, itineraryId, sourceType) → 409
  const existing = await db
    .select()
    .from(portalItems)
    .where(
      and(
        eq(portalItems.portalId, portalId),
        eq(portalItems.itineraryId, itineraryId),
        eq(portalItems.sourceType, sourceType)
      )
    )
    .limit(1);

  if (existing[0]) {
    return NextResponse.json(
      { error: `This itinerary is already attached as "${viewType}"` },
      { status: 409 }
    );
  }

  const items = await db.select().from(portalItems).where(eq(portalItems.portalId, portalId));
  const nextPosition = items.length > 0 ? Math.max(...items.map(i => i.position ?? 0)) + 1 : 0;

  const result = await db.insert(portalItems).values({
    portalId,
    sourceType,
    itineraryId,
    position: nextPosition,
  }).returning();

  return NextResponse.json({ success: true, portalItemId: result[0].id });
}
