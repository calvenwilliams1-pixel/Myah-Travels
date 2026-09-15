import { db } from "@/lib/db";
import { itineraryTravelLegs } from "@/drizzle/schema";
import { eq, inArray, asc } from "drizzle-orm";

// ============================================
// CRUD
// ============================================

export async function getLegsForSegment(segmentId: number) {
  return db
    .select()
    .from(itineraryTravelLegs)
    .where(eq(itineraryTravelLegs.segmentId, segmentId))
    .orderBy(asc(itineraryTravelLegs.legOrder));
}

/**
 * Batch-load legs for many segments at once. Returns a Map keyed by
 * segmentId. Avoids N+1 queries when assembling a full itinerary.
 */
export async function getLegsForSegments(
  segmentIds: number[]
): Promise<Map<number, TravelLeg[]>> {
  if (segmentIds.length === 0) return new Map();

  const rows = await db
    .select()
    .from(itineraryTravelLegs)
    .where(inArray(itineraryTravelLegs.segmentId, segmentIds))
    .orderBy(asc(itineraryTravelLegs.segmentId), asc(itineraryTravelLegs.legOrder));

  const map = new Map<number, TravelLeg[]>();
  for (const row of rows) {
    const arr = map.get(row.segmentId) ?? [];
    arr.push(row as TravelLeg);
    map.set(row.segmentId, arr);
  }
  return map;
}

export async function createLeg(
  segmentId: number,
  data: {
    travelMode: string;
    origin?: string;
    destination?: string;
    departureAt?: string;
    arrivalAt?: string;
    originTimezone?: string;
    destinationTimezone?: string;
    operator?: string;
    identifier?: string;
    reference?: string;
  }
) {
  const existing = await getLegsForSegment(segmentId);
  const nextOrder = existing.length > 0
    ? Math.max(...existing.map((l) => l.legOrder)) + 1
    : 1;

  return db
    .insert(itineraryTravelLegs)
    .values({
      segmentId,
      legOrder: nextOrder,
      travelMode: data.travelMode,
      origin: data.origin ?? null,
      destination: data.destination ?? null,
      departureAt: data.departureAt ?? null,
      arrivalAt: data.arrivalAt ?? null,
      originTimezone: data.originTimezone ?? null,
      destinationTimezone: data.destinationTimezone ?? null,
      operator: data.operator ?? null,
      identifier: data.identifier ?? null,
      reference: data.reference ?? null,
    })
    .returning();
}

export async function updateLeg(
  id: number,
  data: Partial<{
    travelMode: string;
    origin: string;
    destination: string;
    departureAt: string;
    arrivalAt: string;
    originTimezone: string;
    destinationTimezone: string;
    operator: string;
    identifier: string;
    reference: string;
  }>
) {
  return db
    .update(itineraryTravelLegs)
    .set(data)
    .where(eq(itineraryTravelLegs.id, id))
    .returning();
}

/**
 * Delete a leg. Refuses if it is the last remaining leg on its segment —
 * the caller must delete the segment instead. Returns { ok: true } or
 * { ok: false, error: string }.
 */
export async function deleteLeg(
  id: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const leg = await db
    .select()
    .from(itineraryTravelLegs)
    .where(eq(itineraryTravelLegs.id, id))
    .limit(1);

  if (leg.length === 0) return { ok: false, error: "Leg not found" };

  const siblings = await getLegsForSegment(leg[0].segmentId);
  if (siblings.length <= 1) {
    return {
      ok: false,
      error: "Delete the segment instead of its last leg",
    };
  }

  await db.delete(itineraryTravelLegs).where(eq(itineraryTravelLegs.id, id));
  return { ok: true };
}

// ============================================
// DERIVED FIELDS (read-time, no storage)
// ============================================

export interface TravelLeg {
  id: number;
  segmentId: number;
  legOrder: number;
  travelMode: string;
  origin: string | null;
  destination: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
  originTimezone: string | null;
  destinationTimezone: string | null;
  operator: string | null;
  identifier: string | null;
  reference: string | null;
}

export interface DerivedTravel {
  origin: string | null;
  destination: string | null;
  departureAt: string | null;
  arrivalAt: string | null;
}

/**
 * Segment-level origin/destination/departure/arrival = first leg's origin,
 * last leg's destination, first leg's departure, last leg's arrival.
 */
export function deriveSegmentTravel(legs: TravelLeg[]): DerivedTravel {
  if (legs.length === 0) {
    return { origin: null, destination: null, departureAt: null, arrivalAt: null };
  }
  const sorted = [...legs].sort((a, b) => a.legOrder - b.legOrder);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return {
    origin: first.origin,
    destination: last.destination,
    departureAt: first.departureAt,
    arrivalAt: last.arrivalAt,
  };
}

export interface ConnectionGap {
  afterLegOrder: number;
  minutes: number;
  crossesDate: boolean;
  daysCrossed: number;
}

/**
 * Parse a naive datetime string ("YYYY-MM-DDTHH:MM" or similar) into a
 * Date. No timezone conversion — the string is treated exactly as entered.
 */
function parseNaive(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Compute the connection gap between each consecutive pair of legs.
 * Times are treated as literal naive values — no timezone math.
 */
export function computeConnectionGaps(legs: TravelLeg[]): ConnectionGap[] {
  const sorted = [...legs].sort((a, b) => a.legOrder - b.legOrder);
  const gaps: ConnectionGap[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    const arrivalA = parseNaive(a.arrivalAt);
    const departureB = parseNaive(b.departureAt);
    if (!arrivalA || !departureB) continue;

    const diffMs = departureB.getTime() - arrivalA.getTime();
    const minutes = Math.round(diffMs / 60000);

    const dateA = arrivalA.toISOString().slice(0, 10);
    const dateB = departureB.toISOString().slice(0, 10);
    const crossesDate = dateA !== dateB;
    const daysCrossed = crossesDate
      ? Math.round(
          (new Date(dateB).getTime() - new Date(dateA).getTime()) / 86400000
        )
      : 0;

    gaps.push({
      afterLegOrder: a.legOrder,
      minutes,
      crossesDate,
      daysCrossed,
    });
  }
  return gaps;
}

/**
 * For a given leg, does arrival cross a calendar date from departure?
 * Used to show a "+N days" badge.
 */
export function legCrossesDate(leg: TravelLeg): { crosses: boolean; days: number } {
  const dep = parseNaive(leg.departureAt);
  const arr = parseNaive(leg.arrivalAt);
  if (!dep || !arr) return { crosses: false, days: 0 };

  const dDep = dep.toISOString().slice(0, 10);
  const dArr = arr.toISOString().slice(0, 10);
  if (dDep === dArr) return { crosses: false, days: 0 };
  const days = Math.round(
    (new Date(dArr).getTime() - new Date(dDep).getTime()) / 86400000
  );
  return { crosses: true, days };
}
