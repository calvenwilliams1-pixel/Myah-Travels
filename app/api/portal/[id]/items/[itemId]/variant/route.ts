import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updatePortalItemVariant } from "@/lib/portal-items";
import type { PortalItemVariant } from "@/types/portal-items";

const VALID_VARIANTS: PortalItemVariant[] = ["full", "glance"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  await requireAuth();

  const portalId = Number(params.id);
  const itemId = Number(params.itemId);
  if (!portalId || !itemId) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const variant = body?.variant;

  if (!variant || !VALID_VARIANTS.includes(variant)) {
    return NextResponse.json(
      { error: "variant must be 'full' or 'glance'" },
      { status: 400 }
    );
  }

  const result = await updatePortalItemVariant(itemId, portalId, variant);

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (result.error === "not_itinerary") {
      return NextResponse.json(
        { error: "Variants only apply to itinerary items" },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
