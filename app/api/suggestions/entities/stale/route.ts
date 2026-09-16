import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { entities } from "@/drizzle/schema";
import { and, eq, lte, lt, sql } from "drizzle-orm";

// Returns entities used exactly once and not touched in the last 90 days.
// Candidates for cleanup.

export async function GET() {
  await requireAuth();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffIso = cutoff.toISOString();

  const rows = await db
    .select()
    .from(entities)
    .where(
      and(
        lte(entities.useCount, 1),
        lt(entities.lastUsedAt, cutoffIso)
      )
    )
    .orderBy(entities.kind, entities.canonicalName)
    .limit(200);

  return NextResponse.json({ entities: rows });
}
