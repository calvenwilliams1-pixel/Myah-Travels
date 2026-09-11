import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getStaysForSection, createStay } from "@/lib/itineraries";
import { CreateStaySchema } from "@/lib/validation/itinerary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const sectionId = Number(params.id);
  if (!sectionId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const stays = await getStaysForSection(sectionId);
  return NextResponse.json({ stays });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const sectionId = Number(params.id);
  if (!sectionId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateStaySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  const result = await createStay(sectionId, parsed.data);
  return NextResponse.json({ success: true, stay: result[0] });
}
