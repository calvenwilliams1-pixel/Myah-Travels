import { db } from "@/lib/db";
import { fieldValues } from "@/drizzle/schema";
import { eq, and, like, desc, gte } from "drizzle-orm";

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
export async function searchFieldValues(
  fieldKey: string,
  query: string,
  limit = 5
): Promise<FieldValue[]> {
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
