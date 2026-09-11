import { db } from "@/lib/db";
import {
  itineraries,
  itinerarySections,
  itineraryDays,
  itinerarySegments,
  itineraryStays,
} from "@/drizzle/schema";
import { eq, and, isNull, desc, asc } from "drizzle-orm";

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

export async function createItinerary(portalId: number, title: string) {
  return db.insert(itineraries).values({ portalId, title }).returning();
}

export async function updateItinerary(id: number, data: { title?: string }) {
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
  return db.select().from(itinerarySegments)
    .where(eq(itinerarySegments.dayId, dayId))
    .orderBy(asc(itinerarySegments.startTime), asc(itinerarySegments.position));
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
  departureAirport: string;
  arrivalAirport: string;
  departureDatetime: string;
  arrivalDatetime: string;
  airline: string;
  flightNumber: string;
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

  const sectionsWithDays = await Promise.all(
    sections.map(async (section) => {
      const days = await getDaysForSection(section.id);
      const stays = await getStaysForSection(section.id);

      const daysWithSegments = await Promise.all(
        days.map(async (day) => {
          const segments = await getSegmentsForDay(day.id);
          return { ...day, segments };
        })
      );

      return { ...section, days: daysWithSegments, stays };
    })
  );

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
