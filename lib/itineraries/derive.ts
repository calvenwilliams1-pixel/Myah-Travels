import type { getFullItinerary } from "./index";
import type { PortalItemVariant } from "@/types/portal-items";

// Re-export the type so callers can import it from either location.
export type { PortalItemVariant };

type FullItinerary = NonNullable<Awaited<ReturnType<typeof getFullItinerary>>>;

export interface GlanceTransport {
  mode: "flight" | "train" | "bus" | "transfer" | "other";
  operator: string | null;
  identifier: string | null;
  legCount: number;
}

export interface GlanceDay {
  dayNumber: number;
  date: string;
  sectionTitle: string;
  stayName: string | null;
  transport: GlanceTransport[];
  anchorActivity: string | null;
}

export interface GlanceData {
  itineraryTitle: string;
  days: GlanceDay[];
}

/**
 * Map a raw travelMode string to the whitelisted transport union.
 * Unknown values map to "other" rather than throwing.
 */
function mapTravelMode(raw: string | undefined): GlanceTransport["mode"] {
  switch (raw) {
    case "flight":
      return "flight";
    case "train":
      return "train";
    case "bus":
      return "bus";
    case "transfer":
      return "transfer";
    default:
      return "other";
  }
}

/**
 * Derive a client-facing Glance summary from a full itinerary.
 *
 * Pure function: no DB access, no side effects. Takes the output of
 * getFullItinerary and projects only the whitelisted fields. Everything
 * else — times, addresses, references, instructions, phone numbers —
 * is deliberately dropped. This is the spec's core promise.
 */
export function deriveGlance(fullItinerary: FullItinerary): GlanceData {
  const days: GlanceDay[] = [];
  let globalDayNumber = 1;

  for (const section of fullItinerary.sections) {
    // Sort days by date, don't rely on upstream ordering.
    const sortedDays = [...section.days].sort((a, b) =>
      (a.date ?? "").localeCompare(b.date ?? "")
    );

    for (const day of sortedDays) {
      // Stay: checkIn <= day.date < checkOut. Latest checkIn wins on tie.
      const matchingStays = section.stays
        .filter(
          (s) =>
            s.checkInDate &&
            s.checkOutDate &&
            s.checkInDate <= day.date &&
            s.checkOutDate > day.date
        )
        .sort((a, b) => (b.checkInDate ?? "").localeCompare(a.checkInDate ?? ""));
      const stayName = matchingStays[0]?.hotelName ?? null;

      // Transport: one entry per travel segment, sorted by startTime (null last),
      // tiebreaker by segment id for deterministic output.
      const travelSegments = day.segments
        .filter((s: any) => s.type === "travel")
        .sort((a: any, b: any) => {
          if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
          if (a.startTime) return -1;
          if (b.startTime) return 1;
          return (a.id ?? 0) - (b.id ?? 0);
        });

      const transport: GlanceTransport[] = travelSegments.map((seg: any) => {
        const legs: any[] = seg.legs ?? [];
        const firstLeg = legs[0]; // may be undefined for zero-leg travel
        return {
          mode: mapTravelMode(firstLeg?.travelMode),
          operator: firstLeg?.operator ?? seg.airline ?? null,
          identifier: firstLeg?.identifier ?? seg.flightNumber ?? null,
          legCount: legs.length,
        };
      });

      // Anchor activity: first segment with type === "activity".
      const anchorSeg = day.segments.find((s: any) => s.type === "activity");
      const anchorActivity = anchorSeg?.title ?? null;

      days.push({
        dayNumber: globalDayNumber++,
        date: day.date,
        sectionTitle: section.title,
        stayName,
        transport,
        anchorActivity,
      });
    }
  }

  return { itineraryTitle: fullItinerary.title, days };
}
