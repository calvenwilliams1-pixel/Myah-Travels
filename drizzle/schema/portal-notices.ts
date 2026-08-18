import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";

export const portalNotices = sqliteTable(
  "portal_notices",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
    isGlobalAnnouncement: integer("is_global_announcement", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxPortalNoticesPortalId: index("idx_portal_notices_portal_id").on(table.portalId),
    idxPortalNoticesCreatedAt: index("idx_portal_notices_created_at").on(table.createdAt),
    idxPortalNoticesDeletedAt: index("idx_portal_notices_deleted_at").on(table.deletedAt),
  })
);
