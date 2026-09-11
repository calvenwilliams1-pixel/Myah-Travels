import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDaysForSection, createDay } from "@/lib/itineraries";
import { CreateDaySchema } from "@/lib/validation/itinerary";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const sectionId = Number(params.id);
  if (!sectionId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const days = await getDaysForSection(sectionId);
  return NextResponse.json({ days });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();
  const sectionId = Number(params.id);
  if (!sectionId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = CreateDaySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors }, { status: 400 });

  const result = await createDay(sectionId, parsed.data);
  return NextResponse.json({ success: true, day: result[0] });
}
