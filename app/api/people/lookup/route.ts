import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPersonByEmail } from "@/lib/clients/people";

// Force dynamic: this route reads the DB and requires auth. Must not
// be prerendered at build time.
export const dynamic = "force-dynamic";

// SECURITY: Single-admin system — requireAuth() only.

export async function GET(req: NextRequest) {
  await requireAuth();

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim();
  if (!email) return NextResponse.json({ person: null });

  const person = await getPersonByEmail(email);
  return NextResponse.json({ person });
}
