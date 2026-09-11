import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getNotepadEntries,
  searchNotepadEntries,
  addNotepadEntry,
  getDistinctNotepadTags,
} from "@/lib/notepad";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  const entries = query
    ? await searchNotepadEntries(portalId, query)
    : await getNotepadEntries(portalId);

  const distinctTags = await getDistinctNotepadTags(portalId);

  return NextResponse.json({ entries, distinctTags });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content) return NextResponse.json({ error: "Content is required" }, { status: 400 });

  const tags = body.tags ? String(body.tags) : null;

  const result = await addNotepadEntry(portalId, content, tags);
  return NextResponse.json({ success: true, entry: result[0] });
}
