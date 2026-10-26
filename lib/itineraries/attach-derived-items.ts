import { getFullItinerary } from "./index";
import { deriveGlance } from "./derive";
import type { GlanceData } from "./derive";
import type { PortalItemSourceType } from "@/types/portal-items";

interface PortalItemLike {
  id: number;
  sourceType: string;
  itineraryId?: number | null;
}

/**
 * Attach derived data (glance, and later day-by-day) to portal wall items.
 *
 * D-a scope: only `itinerary_glance` items are derived. `itinerary` (full)
 * and all other source types pass through unchanged. D-b adds the
 * `itinerary_today` branch when deriveDayByDay lands.
 *
 * Failure isolation: per-item try/catch, `derivedError: true` on failure.
 * Never throws, never blocks other items.
 */
export async function attachDerivedItems<T extends PortalItemLike>(
  items: T[]
): Promise<(T & { glance?: GlanceData; derivedError?: boolean })[]> {
  return Promise.all(
    items.map(async (item) => {
      if (item.sourceType !== "itinerary_glance") return item;

      if (!item.itineraryId) {
        console.error(
          `[attach-derived-items] portal_item ${item.id} is itinerary_glance but has no itineraryId`
        );
        return { ...item, derivedError: true as const };
      }

      try {
        const full = await getFullItinerary(item.itineraryId);
        if (!full) {
          console.error(
            `[attach-derived-items] portal_item ${item.id} references itinerary ${item.itineraryId} which is missing or deleted`
          );
          return { ...item, derivedError: true as const };
        }
        const glance = deriveGlance(full);
        return { ...item, glance };
      } catch (err) {
        console.error(
          `[attach-derived-items] derive failed for portal_item ${item.id} (itinerary ${item.itineraryId}):`,
          err
        );
        return { ...item, derivedError: true as const };
      }
    })
  );
}
