import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listSnippets, createSnippet } from "@/lib/suggestions/snippets";

export async function GET() {
  await requireAuth();
  const snippets = await listSnippets();
  return NextResponse.json({ snippets });
}

export async function POST(req: NextRequest) {
  await requireAuth();
  const body = await req.json();
  const title = String(body?.title || "").trim();
  const content = String(body?.content || "").trim();
  if (!title || !content) {
    return NextResponse.json({ error: "title and content required" }, { status: 400 });
  }
  const snippet = await createSnippet(title, content);
  if (!snippet) return NextResponse.json({ error: "Failed" }, { status: 500 });
  return NextResponse.json({ success: true, snippet });
}
