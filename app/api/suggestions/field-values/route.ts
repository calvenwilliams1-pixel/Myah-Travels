import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchFieldValues } from "@/lib/suggestions/field-values";

export async function GET(req: NextRequest) {
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

  const items = await searchFieldValues(field, q, 5);
  return NextResponse.json({ items });
}
