import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { updateSection, deleteSection } from "@/lib/itineraries";
import { UpdateSectionSchema } from "@/lib/validation/itinerary";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = UpdateSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await updateSection(id, parsed.data);
  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteSection(id);
  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
