import { NextRequest, NextResponse } from "next/server";
import { getFeedItems } from "@/lib/feed";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "all";
  const sort = searchParams.get("sort") || "newest";
  const category = searchParams.get("category") || "all";
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const items = await getFeedItems(type, sort, category, limit, offset);
    return NextResponse.json({ items });
  } catch (err) {
    console.error("Feed API error:", err);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
