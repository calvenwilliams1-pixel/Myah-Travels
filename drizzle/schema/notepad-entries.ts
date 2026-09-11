import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";

export const notepadEntries = sqliteTable(
  "notepad_entries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    tags: text("tags"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxPortalId: index("idx_notepad_portal_id").on(table.portalId),
    idxDeletedAt: index("idx_notepad_deleted_at").on(table.deletedAt),
  })
);
