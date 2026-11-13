import { NextRequest, NextResponse } from "next/server";
import { getTagSuggestions } from "@/lib/content";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";

  const suggestions = await getTagSuggestions(q);
  return NextResponse.json({
    tags: suggestions.map((t) => t.name),
  });
}
