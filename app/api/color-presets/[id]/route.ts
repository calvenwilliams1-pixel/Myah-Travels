import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { updatePreset, deactivatePreset, getPresetById } from "@/lib/editor/color-presets";

// SECURITY: Single-admin system — requireAuth() only. See /api/color-presets/route.ts.

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const hex = String(body?.hex || "");

  const preset = await updatePreset(id, hex);
  if (!preset) return NextResponse.json({ error: "Invalid hex or preset not found" }, { status: 400 });
  return NextResponse.json({ success: true, preset });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { try {
  await requireAuth();
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const preset = await getPresetById(id);
  if (!preset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deactivatePreset(id);
  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
