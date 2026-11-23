// ============================================================
// PURE DATE / WALL-CLOCK HELPERS
// The single home for calendar arithmetic on the itinerary's
// stored string formats. Everything here is environment-
// independent: no local-time Date parsing, no toISOString
// round-trips, so the server, the browser, and tests all agree.
//
// Stored formats:
// - Dates: "YYYY-MM-DD" (a calendar date, no timezone)
// - Datetimes: "YYYY-MM-DDTHH:MM" (wall-clock time in the
//   timezone recorded alongside it — origin/destination tz)
// ============================================================

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;

/** The "YYYY-MM-DD" calendar date a stored date/datetime string names. */
export function datePartOf(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = DATE_RE.exec(value);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

function utcMsForDate(isoDate: string): number | null {
  const m = DATE_RE.exec(isoDate);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Whole days from one YYYY-MM-DD to another (b − a). Null if either is unparseable. */
export function daysBetweenISODate(a: string, b: string): number | null {
  const msA = utcMsForDate(a);
  const msB = utcMsForDate(b);
  if (msA === null || msB === null) return null;
  return Math.round((msB - msA) / 86400000);
}

/** Add whole days to a YYYY-MM-DD date. Pure UTC math — DST cannot shift it. */
export function addDaysToISODate(isoDate: string, days: number): string | null {
  const ms = utcMsForDate(isoDate);
  if (ms === null) return null;
  const d = new Date(ms + days * 86400000);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const da = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * Minutes between two wall-clock datetimes, compared as written
 * (both are read as if on the same clock). Correct for the uses
 * here: a connection's arrival and next departure are at the same
 * airport, and a leg's own dates are compared as calendar dates.
 * Null if either value is unparseable.
 */
export function wallMinutesBetween(a: string | null, b: string | null): number | null {
  const pa = a ? DATETIME_RE.exec(a) : null;
  const pb = b ? DATETIME_RE.exec(b) : null;
  if (!pa || !pb) return null;
  const msA = Date.UTC(+pa[1], +pa[2] - 1, +pa[3], +pa[4], +pa[5]);
  const msB = Date.UTC(+pb[1], +pb[2] - 1, +pb[3], +pb[4], +pb[5]);
  return Math.round((msB - msA) / 60000);
}

/** UTC offset (ms) of a timezone at an instant, via Intl parts. */
function tzOffsetMs(utcMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/**
 * Absolute instant (epoch ms) of a wall-clock datetime
 * ("YYYY-MM-DDTHH:MM") in the given IANA timezone. Two-pass offset
 * correction handles DST boundaries. Null on bad input.
 */
export function zonedWallToUtcMs(wall: string, timeZone: string): number | null {
  const m = DATETIME_RE.exec(wall?.trim() ?? "");
  if (!m || !timeZone) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  try {
    const off1 = tzOffsetMs(guess, timeZone);
    let utc = guess - off1;
    const off2 = tzOffsetMs(utc, timeZone);
    if (off2 !== off1) utc = guess - off2;
    return utc;
  } catch {
    return null;
  }
}

/**
 * Today's date as "YYYY-MM-DD" in the given IANA timezone
 * (UTC when null/invalid). Same algorithm as derive.ts's
 * formatDateISOInTimezone, kept here so low-level modules do
 * not have to import the derivation layer.
 */
export function todayISOInTimezone(timezone: string | null, now: Date = new Date()): string {
  const tz = timezone || "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
  } catch {
    return todayISOInTimezone("UTC", now);
  }
}
