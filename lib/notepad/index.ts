import { db } from "@/lib/db";
import { notepadEntries } from "@/drizzle/schema";
import { eq, and, isNull, desc, like, or } from "drizzle-orm";

export async function getNotepadEntries(portalId: number) {
  return db.select().from(notepadEntries)
    .where(and(eq(notepadEntries.portalId, portalId), isNull(notepadEntries.deletedAt)))
    .orderBy(desc(notepadEntries.createdAt));
}

export async function searchNotepadEntries(portalId: number, query: string) {
  const pattern = `%${query}%`;
  return db.select().from(notepadEntries)
    .where(and(
      eq(notepadEntries.portalId, portalId),
      isNull(notepadEntries.deletedAt),
      or(
        like(notepadEntries.content, pattern),
        like(notepadEntries.tags, pattern)
      )
    ))
    .orderBy(desc(notepadEntries.createdAt));
}

export async function getNotepadEntryById(id: number) {
  const result = await db.select().from(notepadEntries)
    .where(and(eq(notepadEntries.id, id), isNull(notepadEntries.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function addNotepadEntry(portalId: number, content: string, tags: string | null) {
  return db.insert(notepadEntries).values({
    portalId,
    content,
    tags: tags || null,
  }).returning();
}

export async function updateNotepadEntry(id: number, data: {
  content?: string;
  tags?: string | null;
}) {
  return db.update(notepadEntries)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(notepadEntries.id, id))
    .returning();
}

export async function softDeleteNotepadEntry(id: number) {
  return db.update(notepadEntries)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(notepadEntries.id, id));
}

// Get distinct tag values for autocomplete
export async function getDistinctNotepadTags(portalId: number): Promise<string[]> {
  const entries = await getNotepadEntries(portalId);
  const tagSet = new Set<string>();

  for (const entry of entries) {
    if (!entry.tags) continue;
    entry.tags.split(",").forEach((tag) => {
      const trimmed = tag.trim();
      if (trimmed) tagSet.add(trimmed);
    });
  }

  return Array.from(tagSet).sort();
}
