import { db } from "@/lib/db";
import { folders, media } from "@/drizzle/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

export interface FolderNode {
  id: number;
  name: string;
  parentId: number | null;
  fileCount: number;
  children: FolderNode[];
}

export async function getFolderTree(): Promise<FolderNode[]> {
  const rows = await db
    .select()
    .from(folders)
    .where(isNull(folders.deletedAt))
    .orderBy(folders.name);

  const counts = await db
    .select({ folderId: media.folderId, count: sql<number>`count(*)` })
    .from(media)
    .where(isNull(media.deletedAt))
    .groupBy(media.folderId);

  const countMap = new Map<number, number>();
  for (const row of counts) {
    if (row.folderId !== null) countMap.set(row.folderId, Number(row.count));
  }

  const byId = new Map<number, FolderNode>();
  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      name: row.name,
      parentId: row.parentId,
      fileCount: countMap.get(row.id) ?? 0,
      children: [],
    });
  }

  const roots: FolderNode[] = [];
  for (const node of byId.values()) {
    if (node.parentId === null) {
      roots.push(node);
    } else {
      const parent = byId.get(node.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }
  return roots;
}

export async function getFolderById(id: number) {
  const result = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, id), isNull(folders.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function createFolder(data: { name: string; parentId?: number | null }) {
  return db
    .insert(folders)
    .values({ name: data.name, parentId: data.parentId ?? null })
    .returning();
}

export async function renameFolder(id: number, name: string) {
  return db.update(folders).set({ name }).where(eq(folders.id, id)).returning();
}

async function getAllDescendantIds(id: number): Promise<number[]> {
  const all = await db.select().from(folders).where(isNull(folders.deletedAt));
  const children = new Map<number, number[]>();
  for (const row of all) {
    if (row.parentId !== null) {
      if (!children.has(row.parentId)) children.set(row.parentId, []);
      children.get(row.parentId)!.push(row.id);
    }
  }
  const result: number[] = [];
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    const kids = children.get(current) ?? [];
    for (const k of kids) {
      result.push(k);
      stack.push(k);
    }
  }
  return result;
}

export async function moveFolder(id: number, parentId: number | null) {
  if (parentId !== null) {
    const children = await getAllDescendantIds(id);
    if (parentId === id || children.includes(parentId)) {
      throw new Error("Cannot move folder into itself or a descendant");
    }
  }
  return db.update(folders).set({ parentId }).where(eq(folders.id, id)).returning();
}

export async function softDeleteFolder(id: number) {
  await db.update(media).set({ folderId: null }).where(eq(media.folderId, id));
  const descendants = await getAllDescendantIds(id);
  for (const childId of descendants) {
    await db.update(media).set({ folderId: null }).where(eq(media.folderId, childId));
  }
  const now = new Date().toISOString();
  const allIds = [id, ...descendants];
  for (const fid of allIds) {
    await db.update(folders).set({ deletedAt: now }).where(eq(folders.id, fid));
  }
}

export async function moveFileToFolder(mediaId: number, folderId: number | null) {
  if (folderId !== null) {
    const exists = await getFolderById(folderId);
    if (!exists) throw new Error("Folder not found");
  }
  return db.update(media).set({ folderId }).where(eq(media.id, mediaId)).returning();
}
