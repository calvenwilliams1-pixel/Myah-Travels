import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { duplicateItineraryAsTemplate } from "@/lib/itineraries";

// SECURITY: Single-admin system — requireAuth() only.

export async function POST(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const sourceId = Number(params.id);
  if (!sourceId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const targetPortalId = Number(body?.portalId);
  const newTitle = String(body?.title || "").trim();

  if (!targetPortalId) return NextResponse.json({ error: "portalId required" }, { status: 400 });
  if (!newTitle) return NextResponse.json({ error: "title required" }, { status: 400 });

  const result = await duplicateItineraryAsTemplate(sourceId, targetPortalId, newTitle);
  if (!result) return NextResponse.json({ error: "Duplication failed" }, { status: 500 });

  return NextResponse.json({ success: true, itinerary: result });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
