import type { getFullItinerary } from "./index";

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

// ============================================
// D-b: Day by Day derivation
// ============================================

export type DayByDayState =
  | { state: "pre-trip"; daysUntil: number; destination: string }
  | { state: "during-trip"; day: DayByDayData }
  | { state: "post-trip" }
  | { state: "no-plan-today" }
  | { state: "no-window" };

export interface DayByDayTransport {
  mode: "flight" | "train" | "bus" | "transfer" | "other";
  operator: string | null;
  identifier: string | null;
  origin: string | null;
  destination: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  legCount: number;
}

export interface DayByDaySegment {
  title: string;
  type: "activity" | "travel" | "meal" | "free_day";
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  transport?: DayByDayTransport;
}

export interface DayByDayStay {
  hotelName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  isCheckinDay: boolean;
  isCheckoutDay: boolean;
}

export interface DayByDayData {
  dayNumber: number;
  date: string;
  sectionTitle: string;
  segments: DayByDaySegment[];
  stay: DayByDayStay | null;
}

/**
 * Format a Date as "YYYY-MM-DD" in the given IANA timezone.
 * Deterministic — uses formatToParts, no locale dependence.
 * Falls back to UTC if timezone is null or invalid.
 */
export function formatDateISOInTimezone(date: Date, timezone: string | null): string {
  const tz = timezone || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }
}

/**
 * Compute today's date as "YYYY-MM-DD" in the given timezone.
 * Takes `now` for testability.
 */
export function computeTodayInTimezone(
  timezone: string | null,
  now: Date = new Date()
): string {
  return formatDateISOInTimezone(now, timezone);
}

/**
 * Diff in days between two YYYY-MM-DD strings, parsed as UTC to avoid DST shifts.
 */
function daysBetweenUTC(fromISO: string, toISO: string): number {
  const from = Date.parse(fromISO + "T00:00:00Z");
  const to = Date.parse(toISO + "T00:00:00Z");
  return Math.round((to - from) / 86400000);
}

/**
 * Derive today's plan from a full itinerary.
 *
 * States:
 * - pre-trip: today is before the first day. Returns countdown + destination.
 * - during-trip: today matches a day. Returns that day's medium-detail data.
 * - post-trip: today is after the last day.
 * - no-plan-today: today is within the window but no day row exists for today.
 * - no-window: itinerary has no days at all.
 */
export function deriveDayByDay(
  fullItinerary: FullItinerary,
  today: string,
  destination: string
): DayByDayState {
  // Collect all days across sections
  const allDays: Array<{ section: any; day: any; globalDayNumber: number }> = [];
  let counter = 1;
  for (const section of fullItinerary.sections) {
    for (const day of section.days) {
      allDays.push({ section, day, globalDayNumber: counter++ });
    }
  }

  if (allDays.length === 0) {
    return { state: "no-window" };
  }

  const sortedDates = allDays
    .map(d => d.day.date)
    .filter((d): d is string => typeof d === "string" && d.length > 0)
    .sort();

  if (sortedDates.length === 0) {
    return { state: "no-window" };
  }

  const earliest = sortedDates[0];
  const latest = sortedDates[sortedDates.length - 1];

  if (today < earliest) {
    return {
      state: "pre-trip",
      daysUntil: daysBetweenUTC(today, earliest),
      destination,
    };
  }
  if (today > latest) {
    return { state: "post-trip" };
  }

  const match = allDays.find(d => d.day.date === today);
  if (!match) {
    return { state: "no-plan-today" };
  }

  const { section, day, globalDayNumber } = match;

  // Segments (medium detail: no instructions, no references)
  const segments: DayByDaySegment[] = (day.segments ?? [])
    .slice()
    .sort((a: any, b: any) => {
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      if (a.startTime) return -1;
      if (b.startTime) return 1;
      return (a.id ?? 0) - (b.id ?? 0);
    })
    .map((seg: any) => {
      const base: DayByDaySegment = {
        title: seg.title,
        type: seg.type,
        startTime: seg.startTime ?? null,
        endTime: seg.endTime ?? null,
        location: seg.location ?? null,
      };
      if (seg.type === "travel") {
        const legs: any[] = seg.legs ?? [];
        const firstLeg = legs[0];
        base.transport = {
          mode: mapTravelMode(firstLeg?.travelMode),
          operator: firstLeg?.operator ?? seg.airline ?? null,
          identifier: firstLeg?.identifier ?? seg.flightNumber ?? null,
          origin: firstLeg?.origin ?? null,
          destination: firstLeg?.destination ?? null,
          departureAt: firstLeg?.departureAt ?? null,
          arrivalAt: firstLeg?.arrivalAt ?? null,
          legCount: legs.length,
        };
      }
      return base;
    });

  // Stay (checkIn <= today < checkOut)
  const matchingStays = (section.stays ?? [])
    .filter(
      (s: any) =>
        s.checkInDate &&
        s.checkOutDate &&
        s.checkInDate <= today &&
        s.checkOutDate > today
    )
    .sort((a: any, b: any) => (b.checkInDate ?? "").localeCompare(a.checkInDate ?? ""));

  const stayRow = matchingStays[0];
  const stay: DayByDayStay | null = stayRow
    ? {
        hotelName: stayRow.hotelName,
        checkInTime: stayRow.checkInTime ?? null,
        checkOutTime: stayRow.checkOutTime ?? null,
        isCheckinDay: stayRow.checkInDate === today,
        isCheckoutDay: stayRow.checkOutDate === today,
      }
    : null;

  return {
    state: "during-trip",
    day: {
      dayNumber: globalDayNumber,
      date: day.date,
      sectionTitle: section.title,
      segments,
      stay,
    },
  };
}
