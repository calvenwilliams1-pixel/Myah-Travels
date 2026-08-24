import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAllTemplates, saveTemplate } from "@/lib/canvas";

export async function GET(req: NextRequest) {
  const user = await requireAuth();
  const userId = Number(user.id);
  const contentType = req.nextUrl.searchParams.get("type") || "post";
  const templates = await getAllTemplates(contentType, userId);
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const userId = Number(user.id);
  const body = await req.json();

  if (!body.name || !body.contentType || !body.layoutData) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const parsed = JSON.parse(body.layoutData);
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.elements)) {
      return NextResponse.json({ error: "Invalid layoutData" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const template = await saveTemplate({
    name: body.name,
    contentType: body.contentType,
    layoutData: body.layoutData,
    userId,
  });

  return NextResponse.json({ template });
}
