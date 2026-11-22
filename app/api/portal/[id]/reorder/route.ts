import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { reorderPortalItems } from "@/lib/portal-items";
import { ReorderItemsSchema } from "@/lib/validation/portal";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) { try {
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
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
