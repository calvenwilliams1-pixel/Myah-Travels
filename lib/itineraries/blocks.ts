import { db } from "@/lib/db";
import { itineraryBlocks } from "@/drizzle/schema";
import { eq, inArray, asc } from "drizzle-orm";

export type BlockType = "image" | "callout" | "notice";
export type BlockSlot = "before-day" | "after-morning" | "after-afternoon" | "after-evening";
export type BlockSize = "small" | "medium" | "full";
export type BlockVariant = "tip" | "warning" | "info";

export interface ItineraryBlock {
  id: number;
  itineraryId: number;
  sectionId: number | null;
  dayId: number | null;
  blockType: string;
  slot: string;
  position: number | null;
  imageUrl: string | null;
  imageAlt: string | null;
  textContent: string | null;
  variant: string | null;
  size: string;
  paletteOverride: string | null;
  createdAt: string | null;
}

export interface CreateBlockInput {
  itineraryId: number;
  sectionId?: number | null;
  dayId?: number | null;
  blockType: BlockType;
  slot: BlockSlot;
  imageUrl?: string;
  imageAlt?: string;
  textContent?: string;
  variant?: BlockVariant;
  size?: BlockSize;
  paletteOverride?: string | null;
  position?: number;
}

export async function getBlocksForItinerary(itineraryId: number): Promise<ItineraryBlock[]> {
  return db
    .select()
    .from(itineraryBlocks)
    .where(eq(itineraryBlocks.itineraryId, itineraryId))
    .orderBy(asc(itineraryBlocks.position), asc(itineraryBlocks.id));
}

/**
 * Batch-load blocks for many days at once, keyed by dayId. Blocks with
 * day_id set are attached to a day; blocks with only section_id set are
 * loaded separately by the caller.
 */
export async function getBlocksForDays(dayIds: number[]): Promise<Map<number, ItineraryBlock[]>> {
  if (dayIds.length === 0) return new Map();
  const rows = await db
    .select()
    .from(itineraryBlocks)
    .where(inArray(itineraryBlocks.dayId, dayIds))
    .orderBy(asc(itineraryBlocks.position), asc(itineraryBlocks.id));

  const map = new Map<number, ItineraryBlock[]>();
  for (const row of rows) {
    if (row.dayId == null) continue;
    const arr = map.get(row.dayId) ?? [];
    arr.push(row as ItineraryBlock);
    map.set(row.dayId, arr);
  }
  return map;
}

export async function getBlocksForSection(sectionId: number): Promise<ItineraryBlock[]> {
  return db
    .select()
    .from(itineraryBlocks)
    .where(eq(itineraryBlocks.sectionId, sectionId))
    .orderBy(asc(itineraryBlocks.position), asc(itineraryBlocks.id));
}

export async function createBlock(input: CreateBlockInput): Promise<ItineraryBlock> {
  // Enforce section XOR day at the app layer (DB also has CHECK constraints).
  const hasSection = input.sectionId != null;
  const hasDay = input.dayId != null;
  if (hasSection === hasDay) {
    throw new Error("Block must belong to exactly one of section_id or day_id");
  }

  const result = await db
    .insert(itineraryBlocks)
    .values({
      itineraryId: input.itineraryId,
      sectionId: input.sectionId ?? null,
      dayId: input.dayId ?? null,
      blockType: input.blockType,
      slot: input.slot,
      position: input.position ?? 0,
      imageUrl: input.imageUrl ?? null,
      imageAlt: input.imageAlt ?? null,
      textContent: input.textContent ?? null,
      variant: input.variant ?? null,
      size: input.size ?? "medium",
      paletteOverride: input.paletteOverride ?? null,
    })
    .returning();
  return result[0] as ItineraryBlock;
}

export async function updateBlock(
  id: number,
  data: Partial<{
    slot: BlockSlot;
    position: number;
    imageUrl: string;
    imageAlt: string;
    textContent: string;
    variant: BlockVariant;
    size: BlockSize;
    paletteOverride: string | null;
  }>
): Promise<ItineraryBlock | null> {
  const result = await db
    .update(itineraryBlocks)
    .set(data)
    .where(eq(itineraryBlocks.id, id))
    .returning();
  return (result[0] as ItineraryBlock) ?? null;
}

export async function deleteBlock(id: number): Promise<void> {
  await db.delete(itineraryBlocks).where(eq(itineraryBlocks.id, id));
}

export async function getBlockById(id: number): Promise<ItineraryBlock | null> {
  const result = await db
    .select()
    .from(itineraryBlocks)
    .where(eq(itineraryBlocks.id, id))
    .limit(1);
  return (result[0] as ItineraryBlock) ?? null;
}
