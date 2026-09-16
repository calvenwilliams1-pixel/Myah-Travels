import { db } from "@/lib/db";
import { fieldValues } from "@/drizzle/schema";
import { eq, and, like, desc, gte, sql } from "drizzle-orm";

export interface FieldValue {
  id: number;
  fieldKey: string;
  value: string;
  source: string;
  useCount: number;
  lastUsedAt: string;
  createdAt: string | null;
}

interface UpsertFieldValueInput {
  fieldKey: string;
  value: string;
  source?: "migration" | "user";
}

export async function upsertFieldValue(input: UpsertFieldValueInput): Promise<void> {
  const trimmed = input.value.trim();
  if (!trimmed) return;

  const now = new Date().toISOString();
  const existing = await db
    .select()
    .from(fieldValues)
    .where(and(eq(fieldValues.fieldKey, input.fieldKey), eq(fieldValues.value, trimmed)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(fieldValues).values({
      fieldKey: input.fieldKey,
      value: trimmed,
      source: input.source ?? "user",
      useCount: 1,
      lastUsedAt: now,
    });
    return;
  }

  const current = existing[0];
  await db
    .update(fieldValues)
    .set({ useCount: current.useCount + 1, lastUsedAt: now })
    .where(eq(fieldValues.id, current.id));
}

/**
 * Search field values for a given field key. Filters to use_count >= 2
 * to hide typos and one-offs. All values remain stored.
 */
// Threshold at which we switch from LIKE to FTS5. Below this, LIKE
// is faster because FTS5 has setup overhead per query.
const FTS_THRESHOLD = 50000;

export async function searchFieldValues(
  fieldKey: string,
  query: string,
  limit = 5
): Promise<FieldValue[]> {
  const total = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(fieldValues)
    .where(eq(fieldValues.fieldKey, fieldKey))
    .then((r) => Number(r[0]?.n ?? 0));

  if (total >= FTS_THRESHOLD) {
    return searchFieldValuesFts(fieldKey, query, limit);
  }

  const pattern = `%${query}%`;
  const rows = await db
    .select()
    .from(fieldValues)
    .where(
      and(
        eq(fieldValues.fieldKey, fieldKey),
        like(fieldValues.value, pattern),
        gte(fieldValues.useCount, 2)
      )
    )
    .orderBy(desc(fieldValues.useCount), desc(fieldValues.lastUsedAt))
    .limit(limit);
  return rows as FieldValue[];
}

async function searchFieldValuesFts(
  fieldKey: string,
  query: string,
  limit: number
): Promise<FieldValue[]> {
  // FTS5 MATCH with a prefix wildcard. We join back to field_values
  // for use_count and last_used_at, which the FTS shadow doesn't carry.
  const safeQuery = query.replace(/[^a-zA-Z0-9 ]/g, " ").trim();
  if (!safeQuery) return [];
  const ftsQuery = safeQuery.split(/\s+/).map((w) => w + "*").join(" ");

  const rows = await db.all(sql`
    SELECT fv.*
    FROM field_values_fts fts
    JOIN field_values fv ON fv.id = fts.rowid
    WHERE field_values_fts MATCH ${ftsQuery}
      AND fv.field_key = ${fieldKey}
      AND fv.use_count >= 2
    ORDER BY fv.use_count DESC, fv.last_used_at DESC
    LIMIT ${limit}
  `);
  return rows as FieldValue[];
}

export async function listAllFieldValues(fieldKey: string, limit = 100): Promise<FieldValue[]> {
  const rows = await db
    .select()
    .from(fieldValues)
    .where(eq(fieldValues.fieldKey, fieldKey))
    .orderBy(desc(fieldValues.useCount))
    .limit(limit);
  return rows as FieldValue[];
}

export async function deleteFieldValue(id: number): Promise<void> {
  await db.delete(fieldValues).where(eq(fieldValues.id, id));
}
