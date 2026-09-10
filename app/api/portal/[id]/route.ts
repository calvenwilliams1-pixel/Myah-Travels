import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPortalById } from "@/lib/portal";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await requireAuth();

  const portalId = Number(params.id);
  if (!portalId) return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });

  const portal = await getPortalById(portalId);
  if (!portal) return NextResponse.json({ error: "Portal not found" }, { status: 404 });

  return NextResponse.json({ portal });
}
