import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTemplateById, updateTemplate, deleteTemplate, duplicateTemplate } from "@/lib/canvas";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const userId = Number(user.id);
  const template = await getTemplateById(Number(params.id), userId);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const userId = Number(user.id);
  const body = await req.json();
  const result = await updateTemplate(Number(params.id), userId, body);
  if (!result) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  return NextResponse.json({ result });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const userId = Number(user.id);
  const result = await deleteTemplate(Number(params.id), userId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();
  const userId = Number(user.id);
  const body = await req.json();
  const result = await duplicateTemplate(Number(params.id), userId, body?.name);
  if (!result) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  return NextResponse.json({ result });
}
