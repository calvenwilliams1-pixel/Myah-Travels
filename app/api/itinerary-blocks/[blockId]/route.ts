import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getItineraryById } from "@/lib/itineraries";
import { getBlockById, updateBlock, deleteBlock } from "@/lib/itineraries/blocks";
import { UpdateItineraryBlockSchema } from "@/lib/validation/itinerary";

export async function PATCH(req: NextRequest, { params }: { params: { blockId: string } }) {
  await requireAuth();
  const blockId = Number(params.blockId);
  if (!blockId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  // Ownership: block -> itinerary must exist
  const existing = await getBlockById(blockId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const itinerary = await getItineraryById(existing.itineraryId);
  if (!itinerary) return NextResponse.json({ error: "Itinerary not found" }, { status: 403 });

  const body = await req.json();
  const parsed = UpdateItineraryBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  const block = await updateBlock(blockId, parsed.data);
  return NextResponse.json({ success: true, block });
}

export async function DELETE(req: NextRequest, { params }: { params: { blockId: string } }) {
  await requireAuth();
  const blockId = Number(params.blockId);
  if (!blockId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await getBlockById(blockId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const itinerary = await getItineraryById(existing.itineraryId);
  if (!itinerary) return NextResponse.json({ error: "Itinerary not found" }, { status: 403 });

  await deleteBlock(blockId);
  return NextResponse.json({ success: true });
}
