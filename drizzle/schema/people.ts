import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";
import { clients } from "./clients";

// ============================================================
// PEOPLE (Phase 9)
// Canonical client records that persist across portals.
// Email is the identity key. Person is a first-class domain
// object — not a suggestion cache like entities.
// ============================================================

export const people = sqliteTable(
  "people",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    canonicalName: text("canonical_name"),
    // Optional link to the original inquiry if this person converted
    inquiryId: integer("inquiry_id").references(() => clients.id, { onDelete: "set null" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    unqEmail: uniqueIndex("unq_people_email").on(table.email),
    idxCanonicalName: index("idx_people_canonical_name").on(table.canonicalName),
  })
);

// ============================================================
// PERSON NOTES
// portal_id set = trip-specific note
// portal_id null = global memory note
// ON DELETE SET NULL so notes survive portal purge.
// ============================================================

export const personNotes = sqliteTable(
  "person_notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    portalId: integer("portal_id").references(() => portals.id, { onDelete: "set null" }),
    content: text("content").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxPersonId: index("idx_person_notes_person_id").on(table.personId),
    idxPortalId: index("idx_person_notes_portal_id").on(table.portalId),
  })
);

// ============================================================
// PERSON TRIP HISTORY
// Written at link time (when a portal_member is created).
// Survives portal purge — carries trip identity directly so
// the person page can render context after the portal is gone.
// ============================================================

export const personTripHistory = sqliteTable(
  "person_trip_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    personId: integer("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    portalId: integer("portal_id").references(() => portals.id, { onDelete: "set null" }),
    itineraryId: integer("itinerary_id"),
    tripTitle: text("trip_title").notNull(),
    tripStartDate: text("trip_start_date"),
    tripEndDate: text("trip_end_date"),
    destination: text("destination"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxPersonId: index("idx_person_trip_history_person_id").on(table.personId),
    idxPortalId: index("idx_person_trip_history_portal_id").on(table.portalId),
  })
);
