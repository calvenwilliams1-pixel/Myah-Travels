import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { getPortals } from "@/lib/portal";

// Force dynamic: this route reads the DB and requires auth. Must not
// be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET() { try {
  await requireAuth();
  const portals = await getPortals();
  return NextResponse.json({
    portals: portals.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
    })),
  });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
