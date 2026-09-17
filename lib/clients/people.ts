import { db } from "@/lib/db";
import { people, personNotes, personTripHistory } from "@/drizzle/schema";
import { eq, and, isNull, desc, like, sql } from "drizzle-orm";

export interface Person {
  id: number;
  email: string;
  canonicalName: string | null;
  inquiryId: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface PersonNote {
  id: number;
  personId: number;
  portalId: number | null;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface PersonTrip {
  id: number;
  personId: number;
  portalId: number | null;
  itineraryId: number | null;
  tripTitle: string;
  tripStartDate: string | null;
  tripEndDate: string | null;
  destination: string | null;
  createdAt: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Find or create a person by email. Case-insensitive, trimmed.
 * Returns the person record.
 */
export async function upsertPersonByEmail(
  email: string,
  canonicalName?: string
): Promise<Person> {
  const normalized = normalizeEmail(email);

  const existing = await db
    .select()
    .from(people)
    .where(eq(people.email, normalized))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    // Update name if new info provided and it differs
    if (canonicalName && canonicalName.trim() && canonicalName.trim() !== current.canonicalName) {
      const updated = await db
        .update(people)
        .set({ canonicalName: canonicalName.trim(), updatedAt: new Date().toISOString() })
        .where(eq(people.id, current.id))
        .returning();
      return updated[0] as Person;
    }
    return current as Person;
  }

  const created = await db
    .insert(people)
    .values({
      email: normalized,
      canonicalName: canonicalName?.trim() || null,
    })
    .returning();
  return created[0] as Person;
}

export async function getPersonById(id: number): Promise<Person | null> {
  const result = await db.select().from(people).where(eq(people.id, id)).limit(1);
  return (result[0] as Person) ?? null;
}

export async function getPersonByEmail(email: string): Promise<Person | null> {
  const normalized = normalizeEmail(email);
  const result = await db.select().from(people).where(eq(people.email, normalized)).limit(1);
  return (result[0] as Person) ?? null;
}

/**
 * List or search people. Search hits email + canonical_name.
 * LIKE-based; FTS5 deferred until scale requires it.
 */
export async function searchPeople(query: string, limit = 50): Promise<Person[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    const rows = await db
      .select()
      .from(people)
      .where(isNull(people.deletedAt))
      .orderBy(desc(people.updatedAt), desc(people.createdAt))
      .limit(limit);
    return rows as Person[];
  }

  const pattern = "%" + trimmed + "%";
  const rows = await db
    .select()
    .from(people)
    .where(and(isNull(people.deletedAt), sql`(${people.email} LIKE ${pattern} OR ${people.canonicalName} LIKE ${pattern})`))
    .orderBy(desc(people.updatedAt))
    .limit(limit);
  return rows as Person[];
}

export async function updatePerson(
  id: number,
  data: { canonicalName?: string; inquiryId?: number | null }
): Promise<Person | null> {
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (data.canonicalName !== undefined) update.canonicalName = data.canonicalName;
  if (data.inquiryId !== undefined) update.inquiryId = data.inquiryId;

  const result = await db.update(people).set(update).where(eq(people.id, id)).returning();
  return (result[0] as Person) ?? null;
}

/**
 * Hard delete a person and everything attached to them — notes and
 * trip history cascade. Portal memberships keep their row but their
 * person_id is nulled (via FK set null behavior — but since we're not
 * using a real FK here, we null them explicitly).
 */
export async function forgetPerson(id: number): Promise<void> {
  // Null out portal_members.person_id manually (no FK constraint in this schema revision)
  await db.run(sql`UPDATE portal_members SET person_id = NULL WHERE person_id = ${id}`);
  // Notes and trip history cascade via their FK (person_id ON DELETE CASCADE)
  await db.delete(personNotes).where(eq(personNotes.personId, id));
  await db.delete(personTripHistory).where(eq(personTripHistory.personId, id));
  await db.delete(people).where(eq(people.id, id));
}

// ─────────────────────────────────────────────────────────────
// Notes
// ─────────────────────────────────────────────────────────────

export async function listNotesForPerson(
  personId: number,
  portalId?: number | null
): Promise<PersonNote[]> {
  if (portalId !== undefined) {
    const rows = await db
      .select()
      .from(personNotes)
      .where(and(eq(personNotes.personId, personId), portalId === null ? isNull(personNotes.portalId) : eq(personNotes.portalId, portalId), isNull(personNotes.deletedAt)))
      .orderBy(desc(personNotes.createdAt));
    return rows as PersonNote[];
  }
  const rows = await db
    .select()
    .from(personNotes)
    .where(and(eq(personNotes.personId, personId), isNull(personNotes.deletedAt)))
    .orderBy(desc(personNotes.createdAt));
  return rows as PersonNote[];
}

export async function createNote(
  personId: number,
  content: string,
  portalId?: number | null
): Promise<PersonNote | null> {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const created = await db
    .insert(personNotes)
    .values({
      personId,
      portalId: portalId ?? null,
      content: trimmed,
    })
    .returning();
  return created[0] as PersonNote;
}

export async function updateNote(id: number, content: string): Promise<PersonNote | null> {
  const trimmed = content.trim();
  if (!trimmed) return null;
  const result = await db
    .update(personNotes)
    .set({ content: trimmed, updatedAt: new Date().toISOString() })
    .where(eq(personNotes.id, id))
    .returning();
  return (result[0] as PersonNote) ?? null;
}

export async function deleteNote(id: number): Promise<void> {
  await db.update(personNotes).set({ deletedAt: new Date().toISOString() }).where(eq(personNotes.id, id));
}

// ─────────────────────────────────────────────────────────────
// Trip history
// ─────────────────────────────────────────────────────────────

export async function listTripsForPerson(personId: number): Promise<PersonTrip[]> {
  const rows = await db
    .select()
    .from(personTripHistory)
    .where(eq(personTripHistory.personId, personId))
    .orderBy(desc(personTripHistory.tripStartDate), desc(personTripHistory.createdAt));
  return rows as PersonTrip[];
}

/**
 * Record that a person was on a trip. Called at link time (when a
 * portal member is created) and by the backfill. Idempotent per
 * (person, portal) pair.
 */
export async function recordTrip(
  personId: number,
  portalId: number | null,
  tripTitle: string,
  tripStartDate?: string | null,
  tripEndDate?: string | null,
  destination?: string | null,
  itineraryId?: number | null
): Promise<PersonTrip | null> {
  // Idempotency: skip if a row already exists for this (person, portal)
  if (portalId !== null) {
    const existing = await db
      .select()
      .from(personTripHistory)
      .where(and(eq(personTripHistory.personId, personId), eq(personTripHistory.portalId, portalId)))
      .limit(1);
    if (existing.length > 0) return existing[0] as PersonTrip;
  }

  const created = await db
    .insert(personTripHistory)
    .values({
      personId,
      portalId,
      itineraryId: itineraryId ?? null,
      tripTitle,
      tripStartDate: tripStartDate ?? null,
      tripEndDate: tripEndDate ?? null,
      destination: destination ?? null,
    })
    .returning();
  return created[0] as PersonTrip;
}
