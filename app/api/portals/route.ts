import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPortals } from "@/lib/portal";

export async function GET() {
  await requireAuth();
  const portals = await getPortals();
  return NextResponse.json({
    portals: portals.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
    })),
  });
}
