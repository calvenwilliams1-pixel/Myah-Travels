import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { removePortalItem } from "@/lib/portal-items";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const user = await requireAuth();

  const itemId = Number(params.itemId);
  if (!itemId) return NextResponse.json({ error: "Invalid item ID" }, { status: 400 });

  await removePortalItem(itemId);

  return NextResponse.json({ success: true });
}
