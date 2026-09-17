import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateNote, deleteNote } from "@/lib/clients/people";

// SECURITY: Single-admin system — requireAuth() only.

export async function PATCH(req: NextRequest, { params }: { params: { id: string; noteId: string } }) {
  await requireAuth();
  const noteId = Number(params.noteId);
  if (!noteId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const content = String(body?.content || "").trim();
  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const updated = await updateNote(noteId, content);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, note: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; noteId: string } }) {
  await requireAuth();
  const noteId = Number(params.noteId);
  if (!noteId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteNote(noteId);
  return NextResponse.json({ success: true });
}
