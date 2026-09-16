import { db } from "@/lib/db";
import {
  itineraries,
  itinerarySections,
  itineraryDays,
  itinerarySegments,
  itineraryStays,
  itineraryTravelLegs,
  itineraryBlocks,
} from "@/drizzle/schema";
import { eq, and, isNull, desc, asc } from "drizzle-orm";
import { getLegsForSegments, getLegsForSegment } from "./travelLegs";
import { getBlocksForDays } from "./blocks";

// ============================================
// ITINERARY CRUD
// ============================================

export async function getItinerariesForPortal(portalId: number) {
  return db.select().from(itineraries)
    .where(and(eq(itineraries.portalId, portalId), isNull(itineraries.deletedAt)))
    .orderBy(desc(itineraries.createdAt));
}

export async function getItineraryById(id: number) {
  const result = await db.select().from(itineraries)
    .where(and(eq(itineraries.id, id), isNull(itineraries.deletedAt)))
    .limit(1);
  return result[0] ?? null;
}

export async function createItinerary(portalId: number, title: string, themePreset?: string) {
  return db.insert(itineraries).values({
    portalId,
    title,
    themePreset: themePreset ?? null,
  }).returning();
}

export async function updateItinerary(id: number, data: { title?: string; themePreset?: string | null }) {
  return db.update(itineraries)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(itineraries.id, id))
    .returning();
}

export async function softDeleteItinerary(id: number) {
  return db.update(itineraries)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(itineraries.id, id));
}

// ============================================
// SECTIONS
// ============================================

export async function getSectionsForItinerary(itineraryId: number) {
  return db.select().from(itinerarySections)
    .where(eq(itinerarySections.itineraryId, itineraryId))
    .orderBy(asc(itinerarySections.position));
}

export async function getSectionById(id: number) {
  const result = await db.select().from(itinerarySections)
    .where(eq(itinerarySections.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createSection(itineraryId: number, data: {
  title: string;
  baseCity?: string;
  startDate?: string;
  endDate?: string;
}) {
  const sections = await getSectionsForItinerary(itineraryId);
  const nextPosition = sections.length > 0 ? Math.max(...sections.map(s => s.position ?? 0)) + 1 : 0;

  return db.insert(itinerarySections).values({
    itineraryId,
    title: data.title,
    baseCity: data.baseCity ?? null,
    startDate: data.startDate ?? null,
    endDate: data.endDate ?? null,
    position: nextPosition,
  }).returning();
}

export async function updateSection(id: number, data: {
  title?: string;
  baseCity?: string;
  startDate?: string;
  endDate?: string;
  themePresetOverride?: string | null;
}) {
  return db.update(itinerarySections).set(data).where(eq(itinerarySections.id, id)).returning();
}

export async function deleteSection(id: number) {
  return db.delete(itinerarySections).where(eq(itinerarySections.id, id));
}

// ============================================
// DAYS
// ============================================

export async function getDaysForSection(sectionId: number) {
  return db.select().from(itineraryDays)
    .where(eq(itineraryDays.sectionId, sectionId))
    .orderBy(asc(itineraryDays.date));
}

export async function getDayById(id: number) {
  const result = await db.select().from(itineraryDays)
    .where(eq(itineraryDays.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createDay(sectionId: number, data: {
  date: string;
  dayNumber: number;
  title?: string;
  notes?: string;
}) {
  return db.insert(itineraryDays).values({
    sectionId,
    date: data.date,
    dayNumber: data.dayNumber,
    title: data.title ?? null,
    notes: data.notes ?? null,
  }).returning();
}

export async function updateDay(id: number, data: {
  title?: string;
  notes?: string;
}) {
  return db.update(itineraryDays).set(data).where(eq(itineraryDays.id, id)).returning();
}

export async function deleteDay(id: number) {
  return db.delete(itineraryDays).where(eq(itineraryDays.id, id));
}

// ============================================
// SEGMENTS
// ============================================

export async function getSegmentsForDay(dayId: number) {
  // Sort respects the day's order_mode: "manual" orders by manualPosition
  // (nulls fall through to time), "time" orders by startTime. position is
  // the legacy tiebreaker; manualPosition is the new explicit ordering.
  const day = await getDayById(dayId);
  const mode = day?.orderMode ?? "time";

  const segments = await db.select().from(itinerarySegments)
    .where(eq(itinerarySegments.dayId, dayId))
    .orderBy(
      mode === "manual"
        ? asc(itinerarySegments.manualPosition)
        : asc(itinerarySegments.startTime),
      asc(itinerarySegments.startTime),
      asc(itinerarySegments.position)
    );

  // Attach legs to travel segments (batch-load, no N+1).
  const travelIds = segments.filter((s) => s.type === "travel").map((s) => s.id);
  if (travelIds.length === 0) return segments;

  const legsMap = await getLegsForSegments(travelIds);
  return segments.map((s) =>
    s.type === "travel" ? { ...s, legs: legsMap.get(s.id) ?? [] } : s
  );
}

export async function getSegmentById(id: number) {
  const result = await db.select().from(itinerarySegments)
    .where(eq(itinerarySegments.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createSegment(dayId: number, data: {
  type: "activity" | "travel" | "meal" | "free_day";
  startTime?: string;
  endTime?: string;
  title: string;
  location?: string;
  instructions?: string;
  confirmation?: string;
  referenceType?: string;
  referenceLabel?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureDatetime?: string;
  arrivalDatetime?: string;
  airline?: string;
  flightNumber?: string;
}) {
  return db.insert(itinerarySegments).values({
    dayId,
    type: data.type,
    startTime: data.startTime ?? null,
    endTime: data.endTime ?? null,
    title: data.title,
    location: data.location ?? null,
    instructions: data.instructions ?? null,
    confirmation: data.confirmation ?? null,
    referenceType: data.referenceType ?? null,
    referenceLabel: data.referenceLabel ?? null,
    departureAirport: data.departureAirport ?? null,
    arrivalAirport: data.arrivalAirport ?? null,
    departureDatetime: data.departureDatetime ?? null,
    arrivalDatetime: data.arrivalDatetime ?? null,
    airline: data.airline ?? null,
    flightNumber: data.flightNumber ?? null,
  }).returning();
}

export async function updateSegment(id: number, data: Partial<{
  type: "activity" | "travel" | "meal" | "free_day";
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  instructions: string;
  confirmation: string;
  referenceType: string;
  referenceLabel: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDatetime: string;
  arrivalDatetime: string;
  airline: string;
  flightNumber: string;
  isHighlighted: boolean;
}>) {
  return db.update(itinerarySegments).set(data).where(eq(itinerarySegments.id, id)).returning();
}

export async function deleteSegment(id: number) {
  return db.delete(itinerarySegments).where(eq(itinerarySegments.id, id));
}

// ============================================
// STAYS
// ============================================

export async function getStaysForSection(sectionId: number) {
  return db.select().from(itineraryStays)
    .where(eq(itineraryStays.sectionId, sectionId))
    .orderBy(asc(itineraryStays.checkInDate));
}

export async function getStayById(id: number) {
  const result = await db.select().from(itineraryStays)
    .where(eq(itineraryStays.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createStay(sectionId: number, data: {
  hotelName: string;
  address?: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}) {
  return db.insert(itineraryStays).values({
    sectionId,
    hotelName: data.hotelName,
    address: data.address ?? null,
    checkInDate: data.checkInDate,
    checkOutDate: data.checkOutDate,
    checkInTime: data.checkInTime ?? null,
    checkOutTime: data.checkOutTime ?? null,
    notes: data.notes ?? null,
  }).returning();
}

export async function updateStay(id: number, data: Partial<{
  hotelName: string;
  address: string;
  checkInDate: string;
  checkOutDate: string;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
}>) {
  return db.update(itineraryStays).set(data).where(eq(itineraryStays.id, id)).returning();
}

export async function deleteStay(id: number) {
  return db.delete(itineraryStays).where(eq(itineraryStays.id, id));
}

// ============================================
// FULL ITINERARY (for rendering)
// ============================================

export async function getFullItinerary(itineraryId: number) {
  const itinerary = await getItineraryById(itineraryId);
  if (!itinerary) return null;

  const sections = await getSectionsForItinerary(itineraryId);

  // First pass: gather all segments so we can batch-load legs in one query.
  const allSegments: Array<{ dayId: number; segment: any }> = [];
  const daysBySection = new Map<number, any[]>();
  const staysBySection = new Map<number, any[]>();

  for (const section of sections) {
    const days = await getDaysForSection(section.id);
    const stays = await getStaysForSection(section.id);
    staysBySection.set(section.id, stays);

    const daysWithSegs = await Promise.all(
      days.map(async (day) => {
        const segments = await getSegmentsForDay(day.id);
        for (const seg of segments) {
          allSegments.push({ dayId: day.id, segment: seg });
        }
        return { ...day, segments };
      })
    );
    daysBySection.set(section.id, daysWithSegs);
  }

  // Batch-load all travel legs for every segment in this itinerary.
  const travelSegmentIds = allSegments
    .filter((s) => s.segment.type === "travel")
    .map((s) => s.segment.id);

  const legsMap = await getLegsForSegments(travelSegmentIds);

  // Batch-load itinerary blocks (Phase 7.6.9).
  const allDayIds = allSegments.map((s) => s.dayId);
  const blocksMap = await getBlocksForDays(allDayIds);

  // Attach legs to travel segments and blocks to days.
  const sectionsWithDays = sections.map((section) => {
    const days = daysBySection.get(section.id) ?? [];
    const daysWithSegments = days.map((day) => ({
      ...day,
      segments: day.segments.map((seg: any) =>
        seg.type === "travel"
          ? { ...seg, legs: legsMap.get(seg.id) ?? [] }
          : seg
      ),
      blocks: blocksMap.get(day.id) ?? [],
    }));
    return {
      ...section,
      days: daysWithSegments,
      stays: staysBySection.get(section.id) ?? [],
    };
  });

  return { ...itinerary, sections: sectionsWithDays };
}


// ============================================
// SOFT WARNINGS (not errors — returned alongside valid data)
// ============================================

export function detectOverlappingSegments(
  segments: Array<{ startTime: string | null; endTime: string | null; title: string }>
): string[] {
  const warnings: string[] = [];
  const withTimes = segments.filter((s) => s.startTime && s.endTime);

  for (let i = 0; i < withTimes.length; i++) {
    for (let j = i + 1; j < withTimes.length; j++) {
      const a = withTimes[i];
      const b = withTimes[j];
      if (
        a.startTime! < b.endTime! &&
        b.startTime! < a.endTime!
      ) {
        warnings.push(`"${a.title}" overlaps with "${b.title}"`);
      }
    }
  }

  return warnings;
}


// ============================================
// DUPLICATION (Phase 7.8 Wave B)
// ============================================

/**
 * Duplicate a segment within the same day. Copies travel legs when present.
 * manualPosition is reset to null — manual ordering belongs to the
 * destination context, not the source.
 */
export async function duplicateSegment(segmentId: number) {
  const original = await getSegmentById(segmentId);
  if (!original) return null;

  const { id, ...rest } = original;
  const [copy] = await db.insert(itinerarySegments).values({
    ...rest,
    manualPosition: null,
  }).returning();

  // Copy travel legs if present
  const legs = await getLegsForSegment(segmentId);
  for (const leg of legs) {
    const { id: legId, ...legRest } = leg;
    await db.insert(itineraryTravelLegs).values({
      ...legRest,
      segmentId: copy.id,
    });
  }

  return copy;
}

/**
 * Duplicate a day and all its contents (segments + legs + day-anchored blocks).
 * The new day gets orderMode = "time" and manualPosition reset on all copies.
 * Caller supplies the new date and dayNumber.
 */
export async function duplicateDay(
  dayId: number,
  newDate: string,
  newDayNumber: number
) {
  const original = await getDayById(dayId);
  if (!original) return null;

  const [dayCopy] = await db.insert(itineraryDays).values({
    sectionId: original.sectionId,
    date: newDate,
    dayNumber: newDayNumber,
    title: original.title,
    notes: original.notes,
    orderMode: "time",
    position: original.position,
  }).returning();

  const segments = await db.select().from(itinerarySegments)
    .where(eq(itinerarySegments.dayId, dayId))
    .orderBy(asc(itinerarySegments.position));

  for (const seg of segments) {
    const { id: segId, dayId: srcDayId, ...segRest } = seg;
    const [segCopy] = await db.insert(itinerarySegments).values({
      ...segRest,
      dayId: dayCopy.id,
      manualPosition: null,
    }).returning();

    const legs = await getLegsForSegment(segId);
    for (const leg of legs) {
      const { id: legId, ...legRest } = leg;
      await db.insert(itineraryTravelLegs).values({
        ...legRest,
        segmentId: segCopy.id,
      });
    }
  }

  // Copy day-anchored blocks (skip section-anchored — those live on the section)
  const blocks = await db.select().from(itineraryBlocks)
    .where(eq(itineraryBlocks.dayId, dayId));

  for (const block of blocks) {
    const { id: blockId, ...blockRest } = block;
    await db.insert(itineraryBlocks).values({
      ...blockRest,
      dayId: dayCopy.id,
    });
  }

  return dayCopy;
}

/**
 * Copy a segment (and its legs) into a different day, potentially in a
 * different itinerary. manualPosition is reset.
 */
export async function copySegmentToDay(segmentId: number, targetDayId: number) {
  const original = await getSegmentById(segmentId);
  if (!original) return null;

  const { id, dayId: srcDayId, ...rest } = original;
  const [copy] = await db.insert(itinerarySegments).values({
    ...rest,
    dayId: targetDayId,
    manualPosition: null,
  }).returning();

  const legs = await getLegsForSegment(segmentId);
  for (const leg of legs) {
    const { id: legId, ...legRest } = leg;
    await db.insert(itineraryTravelLegs).values({
      ...legRest,
      segmentId: copy.id,
    });
  }

  return copy;
}

/**
 * Extend a section by adding a new empty day at the end, +1 day from the
 * latest existing day.
 */
export async function extendSectionByOneDay(sectionId: number) {
  const existing = await db.select().from(itineraryDays)
    .where(eq(itineraryDays.sectionId, sectionId))
    .orderBy(desc(itineraryDays.date));

  const last = existing[0];
  let newDate: string;
  let newNumber: number;

  if (last) {
    const d = new Date(last.date + "T00:00:00");
    d.setDate(d.getDate() + 1);
    newDate = d.toISOString().slice(0, 10);
    newNumber = (last.dayNumber ?? 0) + 1;
  } else {
    newDate = new Date().toISOString().slice(0, 10);
    newNumber = 1;
  }

  const [day] = await db.insert(itineraryDays).values({
    sectionId,
    date: newDate,
    dayNumber: newNumber,
    orderMode: "time",
  }).returning();

  return day;
}


/**
 * Apply a manual order to a day's segments. Accepts an ordered array of
 * segment IDs; writes gapped manualPosition values (increments of 1000)
 * so future inserts don't require renumbering. Flips the day's orderMode
 * to "manual" atomically.
 *
 * Any segment in the day not present in the array has manualPosition
 * cleared, so partial reorder inputs don't leave stale positions behind.
 */
export async function reorderSegments(dayId: number, orderedSegmentIds: number[]) {
  const day = await getDayById(dayId);
  if (!day) return null;

  const existing = await db.select().from(itinerarySegments)
    .where(eq(itinerarySegments.dayId, dayId));

  const positionMap = new Map<number, number>();
  orderedSegmentIds.forEach((id, idx) => {
    positionMap.set(id, (idx + 1) * 1000);
  });

  await db.transaction(async (tx) => {
    for (const seg of existing) {
      const newPos = positionMap.get(seg.id) ?? null;
      await tx.update(itinerarySegments)
        .set({ manualPosition: newPos })
        .where(eq(itinerarySegments.id, seg.id));
    }
    await tx.update(itineraryDays)
      .set({ orderMode: "manual" })
      .where(eq(itineraryDays.id, dayId));
  });

  return { ok: true };
}

/**
 * Reset a day to time-derived ordering. Clears manualPosition on all
 * segments and flips orderMode back to "time".
 */
export async function resetSegmentOrder(dayId: number) {
  const day = await getDayById(dayId);
  if (!day) return null;

  await db.transaction(async (tx) => {
    await tx.update(itinerarySegments)
      .set({ manualPosition: null })
      .where(eq(itinerarySegments.dayId, dayId));
    await tx.update(itineraryDays)
      .set({ orderMode: "time" })
      .where(eq(itineraryDays.id, dayId));
  });

  return { ok: true };
}
