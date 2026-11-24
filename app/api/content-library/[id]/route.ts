import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { softDeleteLibraryItem, updateLibraryItem } from "@/lib/content-library";
import { AddLibraryItemSchema } from "@/lib/validation/portal";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) { try {
  const user = await requireAuth();

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const body = await req.json();
  const parsed = AddLibraryItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = {
    title: data.title,
    type: data.type,
  };
  if (data.description !== undefined) updates.description = data.description;
  if (data.category !== undefined) updates.category = data.category;
  if (data.filePath !== undefined) updates.filePath = data.filePath;
  if (data.textContent !== undefined) updates.textContent = data.textContent;

  await updateLibraryItem(id, updates as any);

  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: error.status }); } throw e; } }

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) { try {
  const user = await requireAuth();

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  await softDeleteLibraryItem(id);

  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
