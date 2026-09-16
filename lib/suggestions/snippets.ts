import { db } from "@/lib/db";
import { instructionSnippets } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface Snippet {
  id: number;
  title: string;
  content: string;
  useCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function listSnippets(): Promise<Snippet[]> {
  const rows = await db
    .select()
    .from(instructionSnippets)
    .orderBy(desc(instructionSnippets.useCount), desc(instructionSnippets.updatedAt));
  return rows as Snippet[];
}

export async function createSnippet(title: string, content: string): Promise<Snippet | null> {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  if (!trimmedTitle || !trimmedContent) return null;

  const existing = await db
    .select()
    .from(instructionSnippets)
    .where(eq(instructionSnippets.title, trimmedTitle))
    .limit(1);

  if (existing.length > 0) {
    // Update content + bump use_count
    const updated = await db
      .update(instructionSnippets)
      .set({
        content: trimmedContent,
        useCount: existing[0].useCount + 1,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(instructionSnippets.id, existing[0].id))
      .returning();
    return updated[0] as Snippet;
  }

  const created = await db
    .insert(instructionSnippets)
    .values({ title: trimmedTitle, content: trimmedContent, useCount: 1 })
    .returning();
  return created[0] as Snippet;
}

export async function bumpSnippetUse(id: number): Promise<void> {
  await db
    .update(instructionSnippets)
    .set({ useCount: sql`${instructionSnippets.useCount} + 1` })
    .where(eq(instructionSnippets.id, id));
}

export async function deleteSnippet(id: number): Promise<void> {
  await db.delete(instructionSnippets).where(eq(instructionSnippets.id, id));
}
