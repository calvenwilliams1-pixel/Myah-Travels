import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { searchAirports, searchAirlines, searchCruiseLines, searchShips, searchResortBrands } from "@/lib/suggestions/statics";
import { FIELD_KEYS } from "@/lib/suggestions/field-keys";

// Force dynamic: this route reads the DB and requires auth. Must not
// be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) { try {
  await requireAuth();

  const url = new URL(req.url);
  const field = url.searchParams.get("field") || "";
  const q = url.searchParams.get("q") || "";

  if (!field) {
    return NextResponse.json({ error: "field is required" }, { status: 400 });
  }
  if (!q.trim()) {
    return NextResponse.json({ items: [] });
  }

  if (field === FIELD_KEYS.LEG_ORIGIN || field === FIELD_KEYS.LEG_DESTINATION) {
    return NextResponse.json({ items: searchAirports(q, 8) });
  }
  if (field === FIELD_KEYS.LEG_OPERATOR) {
    return NextResponse.json({ items: searchAirlines(q, 8) });
  }
  if (field === FIELD_KEYS.STAY_CRUISE_LINE) {
    return NextResponse.json({ items: searchCruiseLines(q, 8) });
  }
  if (field === FIELD_KEYS.STAY_SHIP) {
    return NextResponse.json({ items: searchShips(q, 8) });
  }
  if (field === FIELD_KEYS.STAY_RESORT_BRAND) {
    return NextResponse.json({ items: searchResortBrands(q, 8) });
  }

  return NextResponse.json({ items: [] });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
