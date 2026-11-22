import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { removePortalItem } from "@/lib/portal-items";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; itemId: string } }) { try {
  const user = await requireAuth();

  const itemId = Number(params.itemId);
  if (!itemId) return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });

  await removePortalItem(itemId);

  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
