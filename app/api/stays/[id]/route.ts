import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { updateStay, deleteStay } from "@/lib/itineraries";
import { recordStayFields } from "@/lib/suggestions/record";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  await updateStay(id, body);
  void recordStayFields({
    hotelName: body.hotelName,
    address: body.address,
    notes: body.notes,
  });
  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await deleteStay(id);
  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
