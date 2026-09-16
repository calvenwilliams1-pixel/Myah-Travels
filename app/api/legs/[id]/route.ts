import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateLeg, deleteLeg } from "@/lib/itineraries/travelLegs";
import { UpdateLegSchema } from "@/lib/validation/itinerary";
import { recordLegFields } from "@/lib/suggestions/record";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = UpdateLegSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const result = await updateLeg(id, parsed.data);
  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  void recordLegFields({
    origin: parsed.data.origin,
    destination: parsed.data.destination,
    operator: parsed.data.operator,
    identifier: parsed.data.identifier,
  });
  return NextResponse.json({ success: true, leg: result[0] });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const result = await deleteLeg(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
