import { db } from "@/lib/db";
import { portalItems, contentLibrary, itineraries } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { ITINERARY_SOURCE_TYPES } from "@/types/portal-items";

export interface PortalSpecificItemData {
  title: string;
  description?: string;
  type: "pdf" | "image" | "text";
  category?: string;
  filePath?: string;
  textContent?: string;
}

export async function getPortalItems(portalId: number) {
  return db.select().from(portalItems)
    .where(eq(portalItems.portalId, portalId))
    .orderBy(portalItems.position);
}

export async function getPortalItemsWithContent(portalId: number) {
  const items = await getPortalItems(portalId);

  return Promise.all(
    items.map(async (item) => {
      if (item.sourceType === "library" && item.contentLibraryId) {
        const libraryId = item.contentLibraryId;
        // A soft-deleted library item is GONE: it must not keep
        // rendering (or serving its file) on client walls just
        // because it is still attached. isMissing lets the wall drop
        // it for clients while admin preview can flag it.
        const libItem = await db.select().from(contentLibrary)
          .where(and(eq(contentLibrary.id, libraryId), isNull(contentLibrary.deletedAt)))
          .limit(1);

        if (!libItem[0]) {
          return {
            ...item,
            isMissing: true,
            resolvedTitle: "Deleted item",
            resolvedDescription: null,
            resolvedType: "pdf",
            resolvedCategory: null,
            resolvedFilePath: null,
            resolvedTextContent: null,
          };
        }

        return {
          ...item,
          isMissing: false,
          resolvedTitle: libItem[0].title,
          resolvedDescription: libItem[0].description ?? null,
          resolvedType: libItem[0].type,
          resolvedCategory: libItem[0].category ?? null,
          resolvedFilePath: libItem[0].filePath ?? null,
          resolvedTextContent: libItem[0].textContent ?? null,
        };
      }

      if (ITINERARY_SOURCE_TYPES.includes(item.sourceType as any) && item.itineraryId) {
        const itineraryId = item.itineraryId;
        const itinerary = await db.select().from(itineraries)
          .where(and(eq(itineraries.id, itineraryId), isNull(itineraries.deletedAt)))
          .limit(1);

        if (!itinerary[0]) {
          return {
            ...item,
            isMissing: true,
            resolvedTitle: "Deleted itinerary",
            resolvedDescription: null,
            resolvedType: "itinerary",
            resolvedCategory: null,
            resolvedFilePath: null,
            resolvedTextContent: null,
          };
        }

        return {
          ...item,
          isMissing: false,
          resolvedTitle: itinerary[0].title,
          resolvedDescription: null,
          resolvedType: "itinerary",
          resolvedCategory: null,
          resolvedFilePath: null,
          resolvedTextContent: null,
        };
      }

      return {
        ...item,
        isMissing: false,
        resolvedTitle: item.title ?? "",
        resolvedDescription: item.description ?? null,
        resolvedType: item.type ?? "pdf",
        resolvedCategory: item.category ?? null,
        resolvedFilePath: item.filePath ?? null,
        resolvedTextContent: item.textContent ?? null,
      };
    })
  );
}

export async function attachLibraryItemToPortal(portalId: number, libraryItemId: number) {
  const items = await getPortalItems(portalId);
  // Attaching the same library item twice would put two identical
  // cards on the wall — return the existing attachment instead.
  const existing = items.find((i) => i.sourceType === "library" && i.contentLibraryId === libraryItemId);
  if (existing) return [existing];

  const nextPosition = items.length > 0 ? Math.max(...items.map((i) => i.position ?? 0)) + 1 : 0;

  return db.insert(portalItems).values({
    portalId,
    sourceType: "library",
    contentLibraryId: libraryItemId ?? 0,
    position: nextPosition,
  }).returning();
}

export async function addPortalSpecificItem(portalId: number, data: PortalSpecificItemData) {
  const items = await getPortalItems(portalId);
  const nextPosition = items.length > 0 ? Math.max(...items.map((i) => i.position ?? 0)) + 1 : 0;

  return db.insert(portalItems).values({
    portalId,
    sourceType: "portal_specific",
    contentLibraryId: null,
    title: data.title,
    description: data.description ?? null,
    type: data.type,
    category: data.category ?? null,
    filePath: data.filePath ?? null,
    textContent: data.textContent ?? null,
    position: nextPosition,
  }).returning();
}

export async function removePortalItem(itemId: number) {
  return db.delete(portalItems).where(eq(portalItems.id, itemId));
}

export async function updatePortalItemVisibility(
  itemId: number,
  portalId: number,
  isVisible: boolean
) {
  const rows = await db
    .select()
    .from(portalItems)
    .where(and(eq(portalItems.id, itemId), eq(portalItems.portalId, portalId)))
    .limit(1);

  if (!rows[0]) return { ok: false, error: "not_found" as const };

  await db.update(portalItems).set({ isVisible }).where(eq(portalItems.id, itemId));
  return { ok: true as const };
}

export async function reorderPortalItems(portalId: number, orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(portalItems)
      .set({ position: i })
      .where(and(eq(portalItems.id, orderedIds[i]), eq(portalItems.portalId, portalId)));
  }
}
