import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const portals = sqliteTable(
  "portals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    // The promo portal: one permanent portal for potential clients.
    // Its magic links/sessions never expire and purge skips it.
    isPromo: integer("is_promo", { mode: "boolean" }).default(false),
    departureDate: text("departure_date"),
    returnDate: text("return_date"),
    heroTitle: text("hero_title"),
    heroSubtitle: text("hero_subtitle"),
    heroImage: text("hero_image"),
    heroPreset: text("hero_preset").default("brand"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
    deletedAt: text("deleted_at"),
    keepUntil: text("keep_until"),
  },
  (table) => ({
    idxPortalsDeletedAt: index("idx_portals_deleted_at").on(table.deletedAt),
    idxPortalsIsActive: index("idx_portals_is_active").on(table.isActive),
  })
);
