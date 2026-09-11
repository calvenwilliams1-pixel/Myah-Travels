import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";

export const itineraries = sqliteTable(
  "itineraries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxPortalId: index("idx_itineraries_portal_id").on(table.portalId),
    idxDeletedAt: index("idx_itineraries_deleted_at").on(table.deletedAt),
  })
);

export const itinerarySections = sqliteTable(
  "itinerary_sections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    itineraryId: integer("itinerary_id")
      .notNull()
      .references(() => itineraries.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    baseCity: text("base_city"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    position: integer("position").default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxItineraryId: index("idx_sections_itinerary_id").on(table.itineraryId),
  })
);

export const itineraryDays = sqliteTable(
  "itinerary_days",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sectionId: integer("section_id")
      .notNull()
      .references(() => itinerarySections.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    dayNumber: integer("day_number").notNull(),
    title: text("title"),
    notes: text("notes"),
    position: integer("position").default(0),
  },
  (table) => ({
    idxSectionId: index("idx_days_section_id").on(table.sectionId),
  })
);

export const itinerarySegments = sqliteTable(
  "itinerary_segments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    dayId: integer("day_id")
      .notNull()
      .references(() => itineraryDays.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    title: text("title").notNull(),
    location: text("location"),
    instructions: text("instructions"),
    confirmation: text("confirmation"),
    departureAirport: text("departure_airport"),
    arrivalAirport: text("arrival_airport"),
    departureDatetime: text("departure_datetime"),
    arrivalDatetime: text("arrival_datetime"),
    airline: text("airline"),
    flightNumber: text("flight_number"),
    position: integer("position").default(0),
  },
  (table) => ({
    idxDayId: index("idx_segments_day_id").on(table.dayId),
  })
);

export const itineraryStays = sqliteTable(
  "itinerary_stays",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sectionId: integer("section_id")
      .notNull()
      .references(() => itinerarySections.id, { onDelete: "cascade" }),
    hotelName: text("hotel_name").notNull(),
    address: text("address"),
    checkInDate: text("check_in_date").notNull(),
    checkOutDate: text("check_out_date").notNull(),
    checkInTime: text("check_in_time"),
    checkOutTime: text("check_out_time"),
    notes: text("notes"),
  },
  (table) => ({
    idxSectionId: index("idx_stays_section_id").on(table.sectionId),
  })
);
