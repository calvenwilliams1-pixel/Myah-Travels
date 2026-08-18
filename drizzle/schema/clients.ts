import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const clients = sqliteTable(
  "clients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fullName: text("full_name").notNull(),
    phone: text("phone"),
    email: text("email"),
    howFound: text("how_found"),
    destination: text("destination"),
    tripDurationDays: integer("trip_duration_days"),
    departureMonthYear: text("departure_month_year"),
    returnMonthYear: text("return_month_year"),
    bestTimeToContact: text("best_time_to_contact"),
    consentToContact: integer("consent_to_contact", { mode: "boolean" }).default(false),
    consentGivenAt: text("consent_given_at"),
    consentIp: text("consent_ip"),
    consentVersion: text("consent_version"),
    customStatement: text("custom_statement"),
    notes: text("notes"),
    status: text("status").default("new"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
    isAnonymized: integer("is_anonymized", { mode: "boolean" }).default(false),
    anonymizedAt: text("anonymized_at"),
  },
  (table) => ({
    idxClientsEmail: index("idx_clients_email").on(table.email),
    idxClientsPhone: index("idx_clients_phone").on(table.phone),
    idxClientsCreatedAt: index("idx_clients_created_at").on(table.createdAt),
    idxClientsDeparture: index("idx_clients_departure").on(table.departureMonthYear),
    idxClientsDeletedAt: index("idx_clients_deleted_at").on(table.deletedAt),
    idxClientsStatus: index("idx_clients_status").on(table.status),
  })
);
