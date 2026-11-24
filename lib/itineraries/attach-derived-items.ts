import { getFullItinerary } from "./index";
import {
  deriveGlance,
  deriveDayByDay,
} from "./derive";
import { todayISOInTimezone } from "./dates";
import type { GlanceData, DayByDayState } from "./derive";

interface PortalItemLike {
  id: number;
  sourceType: string;
  itineraryId?: number | null;
}

/**
 * Attach derived data to portal wall items.
 *
 * - `itinerary_glance` → deriveGlance, attaches `glance`
 * - `itinerary_today` → deriveDayByDay, attaches `dayByDay`
 * - Everything else (including `itinerary` full) passes through unchanged
 *
 * Per-item failure isolation: `derivedError: true` on failure.
 * Never throws, never blocks other items.
 */
export async function attachDerivedItems<T extends PortalItemLike>(
  items: T[]
): Promise<(T & {
  glance?: GlanceData;
  dayByDay?: DayByDayState;
  itineraryFontPairing?: string | null;
  derivedError?: boolean;
})[]> {
  return Promise.all(
    items.map(async (item) => {
      const isGlance = item.sourceType === "itinerary_glance";
      const isToday = item.sourceType === "itinerary_today";

      if (!isGlance && !isToday) return item;

      if (!item.itineraryId) {
        console.error(
          `[attach-derived-items] portal_item ${item.id} is ${item.sourceType} but has no itineraryId`
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

        if (isGlance) {
          // Condense against "today" in the itinerary's own timezone,
          // so finished days drop out of the summary as the trip goes.
          const glance = deriveGlance(full, {
            todayISO: todayISOInTimezone((full as any).timezone ?? null),
          });
          return { ...item, glance, itineraryFontPairing: full.fontPairing ?? null };
        }

        // itinerary_today
        const destination =
          (full.sections?.[0] as any)?.baseCity ||
          full.title ||
          "your trip";
        const dayByDay = deriveDayByDay(full, new Date(), destination);
        return { ...item, dayByDay, itineraryFontPairing: full.fontPairing ?? null };
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
