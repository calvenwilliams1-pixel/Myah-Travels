import { sqliteTable, text, integer, index, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";

export const portalMembers = sqliteTable(
  "portal_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name"),
    optOutGlobalAnnouncement: integer("opt_out_global_announcement", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxPortalMembersPortalId: index("idx_portal_members_portal_id").on(table.portalId),
    idxPortalMembersEmail: index("idx_portal_members_email").on(table.email),
    unqPortalMembersPortalEmail: unique("unq_portal_members_portal_email").on(table.portalId, table.email),
  })
);
