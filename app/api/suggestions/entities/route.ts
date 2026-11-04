import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchEntities, getRecentEntities } from "@/lib/suggestions/entities";

// Force dynamic: this route reads the DB and requires auth. Must not
// be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireAuth();

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") || "";
  const q = url.searchParams.get("q") || "";

  if (!kind) {
    return NextResponse.json({ error: "kind is required" }, { status: 400 });
  }

  const items = q.trim()
    ? await searchEntities(kind, q, 5)
    : await getRecentEntities(kind, 5);

  return NextResponse.json({ items });
}
