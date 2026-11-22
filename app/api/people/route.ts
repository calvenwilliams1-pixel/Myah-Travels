import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth";
import { searchPeople } from "@/lib/clients/people";

// Force dynamic: this route reads the DB and requires auth. Must not
// be prerendered at build time.
export const dynamic = "force-dynamic";

// SECURITY: Single-admin system — requireAuth() only.

export async function GET(req: NextRequest) { try {
  await requireAuth();

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const people = await searchPeople(q, 100);
  return NextResponse.json({ people });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
