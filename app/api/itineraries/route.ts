import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { itineraries, portals } from "@/drizzle/schema";
import { and, isNull, eq, or, like, desc } from "drizzle-orm";

// SECURITY: Single-admin system — requireAuth() only.

export async function GET(req: NextRequest) {
  await requireAuth();

  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") || "all"; // all | live | archived
  const q = (url.searchParams.get("q") || "").trim();

  const conditions: any[] = [isNull(itineraries.deletedAt)];

  if (filter === "live") {
    conditions.push(eq(itineraries.isArchived, false));
  } else if (filter === "archived") {
    conditions.push(eq(itineraries.isArchived, true));
  }

  if (q) {
    conditions.push(like(itineraries.title, "%" + q + "%"));
  }

  const rows = await db
    .select({
      id: itineraries.id,
      title: itineraries.title,
      portalId: itineraries.portalId,
      isArchived: itineraries.isArchived,
      themePreset: itineraries.themePreset,
      createdAt: itineraries.createdAt,
      portalName: portals.name,
      portalSlug: portals.slug,
    })
    .from(itineraries)
    .leftJoin(portals, eq(itineraries.portalId, portals.id))
    .where(and(...conditions))
    .orderBy(desc(itineraries.createdAt))
    .limit(200);

  return NextResponse.json({ itineraries: rows });
}
