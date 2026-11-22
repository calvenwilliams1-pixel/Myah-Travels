import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getSectionById, extendSectionByOneDay } from "@/lib/itineraries";
import { recordOperation, OPERATION_TYPES } from "@/lib/operations/record";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const sectionId = Number(params.id);
  if (!sectionId) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const section = await getSectionById(sectionId);
  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const day = await extendSectionByOneDay(sectionId);
  if (!day) return NextResponse.json({ error: "Extend failed" }, { status: 500 });

  recordOperation(OPERATION_TYPES.EXTEND_DAY, [day.id], { sectionId });
  return NextResponse.json({ success: true, day });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
