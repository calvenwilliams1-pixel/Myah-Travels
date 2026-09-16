import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { suggestionEvents } from "@/drizzle/schema";

// ============================================================
// TELEMETRY (Phase 7.8)
// Records whether a field value was typed fresh or accepted from a
// suggestion. Powers the "did autocomplete actually help?" question
// after a few weeks of real usage.
// ============================================================

export async function POST(req: NextRequest) {
  await requireAuth();

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fieldKey, event, value } = body;
  if (!fieldKey || !event) {
    return NextResponse.json({ error: "fieldKey and event required" }, { status: 400 });
  }

  const valuePreview = typeof value === "string" ? value.slice(0, 60) : null;

  try {
    await db.insert(suggestionEvents).values({
      fieldKey,
      event,
      valuePreview,
    });
  } catch (err) {
    console.warn("[suggestion-telemetry] insert failed:", (err as Error).message);
    // Do not surface failure to the client — telemetry is best-effort.
  }

  return NextResponse.json({ success: true });
}
