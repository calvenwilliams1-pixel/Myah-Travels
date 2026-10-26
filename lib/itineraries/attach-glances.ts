import { getFullItinerary } from "./index";
import { deriveGlance } from "./derive";
import type { GlanceData } from "./derive";

interface PortalItemLike {
  id: number;
  sourceType: string;
  itineraryId?: number | null;
  variant?: string | null;
}

/**
 * Attach derived Glance data to portal wall items.
 *
 * For each item where sourceType === "itinerary" AND variant === "glance",
 * fetch the full itinerary, derive the glance, and attach it as `glance`.
 * Any failure (missing itinerary, derive throw) sets `glanceError: true`
 * on that item only — never throws, never blocks other items.
 *
 * Items not matching the glance criteria are returned unchanged.
 * Uses Promise.all for parallel derivation.
 */
export async function attachGlancesToItems<T extends PortalItemLike>(
  items: T[]
): Promise<(T & { glance?: GlanceData; glanceError?: boolean })[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.sourceType !== "itinerary") return item;
      if (item.variant !== "glance") return item;

      if (!item.itineraryId) {
        console.error(
          `[attach-glances] portal_item ${item.id} is glance variant but has no itineraryId`
        );
        return { ...item, glanceError: true as const };
      }

      try {
        const full = await getFullItinerary(item.itineraryId);
        if (!full) {
          console.error(
            `[attach-glances] portal_item ${item.id} references itinerary ${item.itineraryId} which is missing or deleted`
          );
          return { ...item, glanceError: true as const };
        }
        const glance = deriveGlance(full);
        return { ...item, glance };
      } catch (err) {
        console.error(
          `[attach-glances] derive failed for portal_item ${item.id} (itinerary ${item.itineraryId}):`,
          err
        );
        return { ...item, glanceError: true as const };
      }
    })
  );
}
