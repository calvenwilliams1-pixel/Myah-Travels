import { NextRequest, NextResponse } from "next/server";
import { getFeedItems } from "@/lib/feed";

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[a-z0-9-]+$/.test(s))
    .slice(0, 10);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "all";
  const sort = searchParams.get("sort") || "newest";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const tagSlugs = parseTags(searchParams.get("tags"));

  try {
    const items = await getFeedItems(type, sort, limit, offset, tagSlugs);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Feed API error:", err);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
