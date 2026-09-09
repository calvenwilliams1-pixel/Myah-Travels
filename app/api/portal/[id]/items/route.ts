import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPortalItemsWithContent, attachLibraryItemToPortal, addPortalSpecificItem } from "@/lib/portal-items";
import { AttachLibraryItemSchema, AddPortalSpecificItemSchema } from "@/lib/validation/portal";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();

  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const items = await getPortalItemsWithContent(portalId);

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireAuth();

  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const body = await req.json();

  // Check if attaching from library or portal-specific
  if (body.contentLibraryId) {
    const parsed = AttachLibraryItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
    }
    const item = await attachLibraryItemToPortal(portalId, parsed.data.contentLibraryId);
    return NextResponse.json({ success: true, itemId: item[0].id });
  }

  const parsed = AddPortalSpecificItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors }, { status: 400 });
  }
  const item = await addPortalSpecificItem(portalId, parsed.data);
  return NextResponse.json({ success: true, itemId: item[0].id });
}
