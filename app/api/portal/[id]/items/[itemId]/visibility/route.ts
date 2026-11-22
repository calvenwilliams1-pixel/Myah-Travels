import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { updatePortalItemVisibility } from "@/lib/portal-items";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) { try {
  await requireAuth();

  const portalId = Number(params.id);
  const itemId = Number(params.itemId);
  if (!portalId || !itemId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const isVisible = body?.isVisible;

  if (typeof isVisible !== "boolean") {
    return NextResponse.json(
      { error: "isVisible must be a boolean" },
      { status: 400 }
    );
  }

  const result = await updatePortalItemVisibility(itemId, portalId, isVisible);

  if (!result.ok) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
