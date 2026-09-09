import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";
import { contentLibrary } from "./content-library";

export const portalItems = sqliteTable(
  "portal_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull().default("library"),
    contentLibraryId: integer("content_library_id").references(() => contentLibrary.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    description: text("description"),
    type: text("type"),
    category: text("category"),
    filePath: text("file_path"),
    textContent: text("text_content"),
    position: integer("position").default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxPortalId: index("idx_portal_items_portal_id").on(table.portalId),
    idxPosition: index("idx_portal_items_position").on(table.portalId, table.position),
  })
);
