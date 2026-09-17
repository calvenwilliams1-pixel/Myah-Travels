import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { restoreDefaults } from "@/lib/editor/color-presets";

// SECURITY: Single-admin system — requireAuth() only.

export async function POST() {
  await requireAuth();
  const count = await restoreDefaults();
  return NextResponse.json({ success: true, restored: count });
}
