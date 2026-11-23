import { daysBetweenISODate } from "./dates";

/**
 * The trip summary strip for the top of the client itinerary
 * (Phase 8 Batch 5):
 *
 *   "3 nights Toronto · 7 nights aboard Symphony of the Seas · 2 nights Cancún resort"
 *
 * Built from the stays in trip order. Hotels are named by their
 * section's base city (falling back to the property name), resorts by
 * city + "resort" (or the property name), cruises by the ship.
 */

export interface SummaryStay {
  hotelName: string;
  kind?: string | null;
  checkInDate: string;
  checkOutDate: string;
}

export interface SummarySection {
  baseCity: string | null;
  stays: SummaryStay[];
}

export function tripSummaryStrip(sections: SummarySection[]): string | null {
  const parts: string[] = [];
  for (const section of sections) {
    const stays = [...(section.stays ?? [])].sort((a, b) =>
      (a.checkInDate ?? "").localeCompare(b.checkInDate ?? "")
    );
    for (const stay of stays) {
      const nights = daysBetweenISODate(stay.checkInDate, stay.checkOutDate);
      if (nights === null || nights < 1) continue;
      const nightWord = nights === 1 ? "night" : "nights";
      let label: string;
      if (stay.kind === "cruise") {
        label = `aboard ${stay.hotelName}`;
      } else if (stay.kind === "resort") {
        label = section.baseCity ? `${section.baseCity} resort` : stay.hotelName;
      } else {
        label = section.baseCity ?? stay.hotelName;
      }
      parts.push(`${nights} ${nightWord} ${label}`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
