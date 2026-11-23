import { zonedWallToUtcMs } from "./dates";

/**
 * Phase 8 Batch 4 — trip checks.
 *
 * Accuracy warnings for the itinerary editor. These NEVER block
 * saving; they exist so a wrong date, a double-booked night, or a
 * timezone-trap flight gets noticed while it is still cheap to fix.
 * Pure function over the editor's loaded itinerary shape.
 */

export interface CheckStay {
  hotelName: string;
  kind?: string | null;
  checkInDate: string;
  checkOutDate: string;
}

export interface CheckLeg {
  travelMode: string;
  origin: string | null;
  destination: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  originTimezone: string | null;
  destinationTimezone: string | null;
  operator: string | null;
  identifier: string | null;
}

export interface CheckSegment {
  type: string;
  legs?: CheckLeg[];
}

export interface CheckDay {
  date: string;
  segments: CheckSegment[];
}

export interface CheckSection {
  title: string;
  startDate: string | null;
  endDate: string | null;
  days: CheckDay[];
  stays: CheckStay[];
}

export interface NightsLine {
  sectionTitle: string;
  total: number;
  accounted: number;
}

export interface TripChecks {
  warnings: string[];
  nights: NightsLine[];
  totalNights: number;
  accountedNights: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2027-03-04" → "Mar 4" (year appended when it differs from the first date's). */
function fmt(iso: string, withYear = false): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[+m[2] - 1]} ${+m[3]}${withYear ? `, ${m[1]}` : ""}`;
}

function legLabel(leg: CheckLeg): string {
  if (leg.identifier) return leg.identifier;
  if (leg.origin && leg.destination) return `${leg.origin} → ${leg.destination}`;
  return leg.operator ?? "A flight";
}

export function checkTrip(sections: CheckSection[]): TripChecks {
  const warnings: string[] = [];
  const nights: NightsLine[] = [];
  const allStays: CheckStay[] = sections.flatMap((s) => s.stays ?? []);

  // 1. A stay that falls outside its own section's dates.
  for (const section of sections) {
    if (!section.startDate || !section.endDate) continue;
    for (const stay of section.stays ?? []) {
      if (stay.checkInDate < section.startDate || stay.checkOutDate > section.endDate) {
        warnings.push(
          `${stay.hotelName} (${fmt(stay.checkInDate)} – ${fmt(stay.checkOutDate)}) falls outside the “${section.title}” section dates (${fmt(section.startDate)} – ${fmt(section.endDate)}).`
        );
      }
    }
  }

  // 2. Overlapping stays anywhere in the trip — two beds, one night.
  for (let i = 0; i < allStays.length; i++) {
    for (let j = i + 1; j < allStays.length; j++) {
      const a = allStays[i];
      const b = allStays[j];
      if (a.checkInDate < b.checkOutDate && b.checkInDate < a.checkOutDate) {
        const overlapStart = a.checkInDate > b.checkInDate ? a.checkInDate : b.checkInDate;
        warnings.push(
          `${a.hotelName} and ${b.hotelName} overlap — both cover the night of ${fmt(overlapStart)}.`
        );
      }
    }
  }

  // 3. Nights with no stay, per section. A "night" is each day date
  // except the section's last day (checkout/disembark morning).
  let totalNights = 0;
  let accountedNights = 0;
  for (const section of sections) {
    const dates = [...new Set((section.days ?? []).map((d) => d.date))].sort();
    if (dates.length < 2) continue;
    const nightDates = dates.slice(0, -1);
    const missing: string[] = [];
    let accounted = 0;
    for (const date of nightDates) {
      const covered = allStays.some((s) => s.checkInDate <= date && date < s.checkOutDate);
      if (covered) accounted++;
      else missing.push(date);
    }
    nights.push({ sectionTitle: section.title, total: nightDates.length, accounted });
    totalNights += nightDates.length;
    accountedNights += accounted;
    if (missing.length > 0) {
      warnings.push(
        `${missing.length} night${missing.length === 1 ? "" : "s"} in “${section.title}” ha${missing.length === 1 ? "s" : "ve"} no stay: ${missing.map((d) => fmt(d)).join(", ")}.`
      );
    }
  }

  // 4. Flight legs whose times only make sense — or don't — once
  // timezones are counted.
  for (const section of sections) {
    for (const day of section.days ?? []) {
      for (const segment of day.segments ?? []) {
        if (segment.type !== "travel") continue;
        for (const leg of segment.legs ?? []) {
          if (!leg.departureAt || !leg.arrivalAt) continue;
          const label = legLabel(leg);
          if (!leg.originTimezone || !leg.destinationTimezone) {
            const where = !leg.originTimezone ? leg.origin ?? "departure" : leg.destination ?? "arrival";
            warnings.push(
              `${label} has no timezone for ${where}, so its times can't be checked. Picking the airport from the suggestions fills it in.`
            );
            continue;
          }
          const dep = zonedWallToUtcMs(leg.departureAt, leg.originTimezone);
          const arr = zonedWallToUtcMs(leg.arrivalAt, leg.destinationTimezone);
          if (dep === null || arr === null) continue;
          const minutes = Math.round((arr - dep) / 60000);
          if (minutes <= 0) {
            warnings.push(
              `${label} arrives before it departs once timezones are counted — check the dates and times.`
            );
          } else if (minutes > 24 * 60) {
            warnings.push(
              `${label} runs over 24 hours once timezones are counted — the arrival date is probably wrong.`
            );
          }
        }
      }
    }
  }

  return { warnings, nights, totalNights, accountedNights };
}
