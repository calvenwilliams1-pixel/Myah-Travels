import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getDayById, duplicateDay } from "@/lib/itineraries";
import { recordOperation, OPERATION_TYPES } from "@/lib/operations/record";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const original = await getDayById(id);
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Default: +1 day from the source. Body can override.
  let newDate = "";
  let newNumber = (original.dayNumber ?? 0) + 1;

  try {
    const body = await req.json();
    if (body?.newDate) newDate = String(body.newDate);
    if (typeof body?.newDayNumber === "number") newNumber = body.newDayNumber;
  } catch (authErr) { if (authErr instanceof AuthError) { return NextResponse.json({ error: authErr.message }, { status: authErr.status }); } 
    // no body — use defaults
  }

  if (!newDate) {
    const d = new Date(original.date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    newDate = d.toISOString().slice(0, 10);
  }

  const copy = await duplicateDay(id, newDate, newNumber);
  if (!copy) return NextResponse.json({ error: "Duplicate failed" }, { status: 500 });

  recordOperation(OPERATION_TYPES.DUPLICATE_DAY, [copy.id], { sourceId: id });
  return NextResponse.json({ success: true, day: copy });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
