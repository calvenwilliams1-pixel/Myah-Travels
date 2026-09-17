import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchPeople } from "@/lib/clients/people";

// SECURITY: Single-admin system — requireAuth() only.

export async function GET(req: NextRequest) {
  await requireAuth();

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const people = await searchPeople(q, 100);
  return NextResponse.json({ people });
}
