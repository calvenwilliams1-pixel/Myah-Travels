import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setSetting, getAllSettings } from "@/lib/settings";
import { sanitizeBackgroundImage, clampOpacity, validateHexColor } from "@/lib/theme";

export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updates: Record<string, string> = {};

  if (body.primary_color !== undefined) {
    if (!validateHexColor(body.primary_color)) {
      return NextResponse.json({ error: "Invalid primary color" }, { status: 400 });
    }
    updates.primary_color = body.primary_color;
  }

  if (body.secondary_color !== undefined) {
    if (!validateHexColor(body.secondary_color)) {
      return NextResponse.json({ error: "Invalid secondary color" }, { status: 400 });
    }
    updates.secondary_color = body.secondary_color;
  }

  if (body.accent_color !== undefined) {
    if (!validateHexColor(body.accent_color)) {
      return NextResponse.json({ error: "Invalid accent color" }, { status: 400 });
    }
    updates.accent_color = body.accent_color;
  }

  if (body.background_color !== undefined) {
    if (!validateHexColor(body.background_color)) {
      return NextResponse.json({ error: "Invalid background color" }, { status: 400 });
    }
    updates.background_color = body.background_color;
  }

  if (body.background_image !== undefined) {
    const sanitized = sanitizeBackgroundImage(body.background_image);
    if (sanitized === "" && body.background_image.trim() !== "") {
      return NextResponse.json({ error: "Invalid background image" }, { status: 400 });
    }
    updates.background_image = sanitized;
  }

  if (body.background_opacity !== undefined) {
    const opacity = clampOpacity(String(body.background_opacity));
    updates.background_opacity = String(opacity);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  for (const [key, value] of Object.entries(updates)) {
    await setSetting(key, value);
  }

  const updatedSettings = await getAllSettings();

  return NextResponse.json({ success: true, settings: updatedSettings });
}
