import { datePartOf, daysBetweenISODate, wallMinutesBetween } from "./dates";

// ============================================================
// TRAVEL LEG MATH (pure)
// One implementation, shared by the admin editor, the client
// portal, and the API layer. Previously the portal carried its
// own copies, and both versions parsed wall-clock strings into
// local Dates and read the date back in UTC — so the "+1 day"
// badge and connection dates depended on the timezone of
// whatever machine ran the code. These versions never leave
// the strings' own calendar: deterministic everywhere.
// ============================================================

export interface LegTimes {
  legOrder: number;
  departureAt: string | null;
  arrivalAt: string | null;
}

export interface ConnectionGap {
  afterLegOrder: number;
  minutes: number;
  crossesDate: boolean;
  daysCrossed: number;
}

/**
 * The gap between each pair of consecutive legs. Arrival and the
 * next departure are at the same place, so wall-clock comparison
 * is the right semantics.
 */
export function computeConnectionGaps<T extends LegTimes>(legs: T[]): ConnectionGap[] {
  const sorted = [...legs].sort((a, b) => a.legOrder - b.legOrder);
  const gaps: ConnectionGap[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const minutes = wallMinutesBetween(a.arrivalAt, b.departureAt);
    if (minutes === null) continue;

    const dateA = datePartOf(a.arrivalAt);
    const dateB = datePartOf(b.departureAt);
    const crossesDate = dateA !== null && dateB !== null && dateA !== dateB;
    const daysCrossed = crossesDate ? (daysBetweenISODate(dateA!, dateB!) ?? 0) : 0;

    gaps.push({ afterLegOrder: a.legOrder, minutes, crossesDate, daysCrossed });
  }
  return gaps;
}

/**
 * Does a leg arrive on a later calendar date than it departs?
 * Compares the local dates as written — departure date at the
 * origin, arrival date at the destination — which is exactly
 * what the "+N days" badge means to a traveller.
 */
export function legCrossesDate(leg: LegTimes): { crosses: boolean; days: number } {
  const dDep = datePartOf(leg.departureAt);
  const dArr = datePartOf(leg.arrivalAt);
  if (!dDep || !dArr || dDep === dArr) return { crosses: false, days: 0 };
  return { crosses: true, days: daysBetweenISODate(dDep, dArr) ?? 0 };
}
