import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { listSnippets, createSnippet } from "@/lib/suggestions/snippets";

export async function GET() { try {
  await requireAuth();
  const snippets = await listSnippets();
  return NextResponse.json({ snippets });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function POST(req: NextRequest) { try {
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
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
