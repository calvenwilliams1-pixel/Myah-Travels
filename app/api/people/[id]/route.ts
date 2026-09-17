import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPersonById, forgetPerson } from "@/lib/clients/people";

// SECURITY: Single-admin system — requireAuth() only.

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const person = await getPersonById(id);
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ person });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  const person = await getPersonById(id);
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await forgetPerson(id);
  return NextResponse.json({ success: true });
}
