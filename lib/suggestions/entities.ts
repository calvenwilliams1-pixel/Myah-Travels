import { db } from "@/lib/db";
import { entities } from "@/drizzle/schema";
import { eq, and, like, desc } from "drizzle-orm";

export interface Entity {
  id: number;
  kind: string;
  canonicalName: string;
  identity: Record<string, string>;
  defaults: Record<string, string> | null;
  source: string;
  useCount: number;
  lastUsedAt: string;
  createdAt: string | null;
}

interface UpsertEntityInput {
  kind: string;
  canonicalName: string;
  identity: Record<string, string>;
  defaults?: Record<string, string>;
  source?: "migration" | "user";
}

export async function upsertEntity(input: UpsertEntityInput): Promise<void> {
  const now = new Date().toISOString();
  const existing = await db
    .select()
    .from(entities)
    .where(and(eq(entities.kind, input.kind), eq(entities.canonicalName, input.canonicalName)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(entities).values({
      kind: input.kind,
      canonicalName: input.canonicalName,
      identity: JSON.stringify(input.identity),
      defaults: input.defaults ? JSON.stringify(input.defaults) : null,
      source: input.source ?? "user",
      useCount: 1,
      lastUsedAt: now,
    });
    return;
  }

  const current = existing[0];
  let mergedIdentity: Record<string, string> = {};
  let mergedDefaults: Record<string, string> = {};
  try {
    mergedIdentity = { ...JSON.parse(current.identity), ...input.identity };
  } catch {
    mergedIdentity = input.identity;
  }
  if (current.defaults) {
    try {
      mergedDefaults = JSON.parse(current.defaults);
    } catch {
      mergedDefaults = {};
    }
  }
  if (input.defaults) {
    mergedDefaults = { ...mergedDefaults, ...input.defaults };
  }

  await db
    .update(entities)
    .set({
      identity: JSON.stringify(mergedIdentity),
      defaults: Object.keys(mergedDefaults).length > 0 ? JSON.stringify(mergedDefaults) : null,
      useCount: current.useCount + 1,
      lastUsedAt: now,
    })
    .where(eq(entities.id, current.id));
}

export async function searchEntities(kind: string, query: string, limit = 5): Promise<Entity[]> {
  const pattern = `%${query}%`;
  const rows = await db
    .select()
    .from(entities)
    .where(and(eq(entities.kind, kind), like(entities.canonicalName, pattern)))
    .orderBy(desc(entities.useCount), desc(entities.lastUsedAt))
    .limit(limit);
  return rows.map(hydrate);
}

export async function getRecentEntities(kind: string, limit = 5): Promise<Entity[]> {
  const rows = await db
    .select()
    .from(entities)
    .where(eq(entities.kind, kind))
    .orderBy(desc(entities.lastUsedAt))
    .limit(limit);
  return rows.map(hydrate);
}

export async function deleteEntity(id: number): Promise<void> {
  await db.delete(entities).where(eq(entities.id, id));
}

function hydrate(row: typeof entities.$inferSelect): Entity {
  let identity: Record<string, string> = {};
  let defaults: Record<string, string> | null = null;
  try {
    identity = JSON.parse(row.identity);
  } catch {}
  if (row.defaults) {
    try {
      defaults = JSON.parse(row.defaults);
    } catch {
      defaults = null;
    }
  }
  return {
    id: row.id,
    kind: row.kind,
    canonicalName: row.canonicalName,
    identity,
    defaults,
    source: row.source,
    useCount: row.useCount,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
  };
}
