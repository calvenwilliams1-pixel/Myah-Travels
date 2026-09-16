import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// ============================================================
// TELEMETRY (Phase 7.8)
// Logs suggestion-accepted vs typed-fresh events. Currently writes to
// the console — a real sink (table, file, or external) can be swapped
// in later without changing the client call sites.
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

  // Placeholder sink — dev only
  if (process.env.NODE_ENV !== "production") {
    console.log("[suggestion-telemetry]", JSON.stringify({
      fieldKey,
      event,
      valuePreview: typeof value === "string" ? value.slice(0, 40) : undefined,
      at: new Date().toISOString(),
    }));
  }

  return NextResponse.json({ success: true });
}
