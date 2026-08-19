import { NextRequest, NextResponse } from "next/server";
import { searchContent } from "@/lib/search";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const contentType = searchParams.get("type") || undefined;

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchContent(query.trim(), { contentType });
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
