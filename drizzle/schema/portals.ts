import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const portals = sqliteTable(
  "portals",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    archivedAt: text("archived_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxPortalsDeletedAt: index("idx_portals_deleted_at").on(table.deletedAt),
    idxPortalsIsActive: index("idx_portals_is_active").on(table.isActive),
  })
);
