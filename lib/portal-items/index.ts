import { db } from "@/lib/db";
import { portalItems, contentLibrary, itineraries } from "@/drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

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
        const libItem = await db.select().from(contentLibrary)
          .where(eq(contentLibrary.id, libraryId))
          .limit(1);

        return {
          ...item,
          resolvedTitle: libItem[0]?.title ?? "Deleted item",
          resolvedDescription: libItem[0]?.description ?? null,
          resolvedType: libItem[0]?.type ?? "pdf",
          resolvedCategory: libItem[0]?.category ?? null,
          resolvedFilePath: libItem[0]?.filePath ?? null,
          resolvedTextContent: libItem[0]?.textContent ?? null,
        };
      }

      if (item.sourceType === "itinerary" && item.itineraryId) {
        const itineraryId = item.itineraryId;
        const itinerary = await db.select().from(itineraries)
          .where(and(eq(itineraries.id, itineraryId), isNull(itineraries.deletedAt)))
          .limit(1);

        return {
          ...item,
          resolvedTitle: itinerary[0]?.title ?? "Deleted itinerary",
          resolvedDescription: null,
          resolvedType: "itinerary",
          resolvedCategory: null,
          resolvedFilePath: null,
          resolvedTextContent: null,
        };
      }

      return {
        ...item,
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

export async function reorderPortalItems(portalId: number, orderedIds: number[]) {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.update(portalItems)
      .set({ position: i })
      .where(and(eq(portalItems.id, orderedIds[i]), eq(portalItems.portalId, portalId)));
  }
}
