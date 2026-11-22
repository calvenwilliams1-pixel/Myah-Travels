import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getTemplateById, updateTemplate, deleteTemplate, duplicateTemplate } from "@/lib/canvas";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) { try {
  const user = await requireAuth();
  const userId = Number(user.id);
  const template = await getTemplateById(Number(params.id), userId);
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ template });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) { try {
  const user = await requireAuth();
  const userId = Number(user.id);
  const body = await req.json();
  const result = await updateTemplate(Number(params.id), userId, body);
  if (!result) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  return NextResponse.json({ result });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { try {
  const user = await requireAuth();
  const userId = Number(user.id);
  const result = await deleteTemplate(Number(params.id), userId);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) { try {
  const user = await requireAuth();
  const userId = Number(user.id);
  const body = await req.json();
  const result = await duplicateTemplate(Number(params.id), userId, body?.name);
  if (!result) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  return NextResponse.json({ result });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
