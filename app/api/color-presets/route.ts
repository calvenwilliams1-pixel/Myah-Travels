import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { listPresets, createPreset, type PresetKind } from "@/lib/editor/color-presets";

// SECURITY: Single-admin system. Role-based authorization is not used
// in this project — all admin routes gate on requireAuth(). If multi-admin
// support ships (Phase 7.3+), revisit and add a role check.

export async function GET(req: NextRequest) { try {
  await requireAuth();
  const url = new URL(req.url);
  const kindParam = url.searchParams.get("kind");
  const kind: PresetKind | undefined =
    kindParam === "text" || kindParam === "highlight" ? kindParam : undefined;
  const includeInactive = url.searchParams.get("includeInactive") === "1";

  const presets = await listPresets(kind, includeInactive);
  return NextResponse.json({ presets });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function POST(req: NextRequest) { try {
  await requireAuth();
  const body = await req.json();
  const name = String(body?.name || "");
  const hex = String(body?.hex || "");
  const kind: PresetKind = body?.kind === "highlight" ? "highlight" : "text";

  const result = await createPreset(name, hex, kind);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, preset: result });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
