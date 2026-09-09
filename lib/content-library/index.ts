import { db } from "@/lib/db";
import { contentLibrary } from "@/drizzle/schema";
import { eq, and, isNull, desc, like } from "drizzle-orm";

export type LibraryItemType = "pdf" | "image" | "text";
export type LibraryCategory = "guide" | "checklist" | "faq" | "alert" | "document" | "other";

export interface LibraryItemData {
  title: string;
  description?: string;
  type: LibraryItemType;
  category?: LibraryCategory;
  filePath?: string;
  textContent?: string;
}

export async function getLibraryItems(options?: { category?: string; search?: string }) {
  const conditions = [isNull(contentLibrary.deletedAt)];

  if (options?.category) {
    conditions.push(eq(contentLibrary.category, options.category));
  }

  if (options?.search) {
    conditions.push(like(contentLibrary.title, `%${options.search}%`));
  }

  return db.select().from(contentLibrary).where(and(...conditions)).orderBy(desc(contentLibrary.createdAt));
}

export async function getLibraryItemById(id: number) {
  const result = await db.select().from(contentLibrary)
    .where(and(eq(contentLibrary.id, id), isNull(contentLibrary.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function addLibraryItem(data: LibraryItemData) {
  return db.insert(contentLibrary).values({
    title: data.title,
    description: data.description ?? null,
    type: data.type,
    category: data.category ?? null,
    filePath: data.filePath ?? null,
    textContent: data.textContent ?? null,
  }).returning();
}

export async function updateLibraryItem(id: number, data: Partial<LibraryItemData>) {
  return db.update(contentLibrary).set(data).where(eq(contentLibrary.id, id)).returning();
}

export async function softDeleteLibraryItem(id: number) {
  return db.update(contentLibrary)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(contentLibrary.id, id));
}
