import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { reorderPortalItems } from "@/lib/portal-items";
import { ReorderItemsSchema } from "@/lib/validation/portal";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();

  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const body = await req.json();
  const parsed = ReorderItemsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }

  await reorderPortalItems(portalId, parsed.data.orderedIds);

  return NextResponse.json({ success: true });
}
