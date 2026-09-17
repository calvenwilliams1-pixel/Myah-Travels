import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listNotesForPerson, createNote } from "@/lib/clients/people";

// SECURITY: Single-admin system — requireAuth() only.

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const personId = Number(params.id);
  if (!personId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const url = new URL(req.url);
  const portalParam = url.searchParams.get("portalId");
  const portalId = portalParam === null ? undefined : portalParam === "null" ? null : Number(portalParam);

  const notes = await listNotesForPerson(personId, portalId);
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const personId = Number(params.id);
  if (!personId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const content = String(body?.content || "").trim();
  const portalId = typeof body?.portalId === "number" ? body.portalId : null;

  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const note = await createNote(personId, content, portalId);
  if (!note) return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  return NextResponse.json({ success: true, note });
}
