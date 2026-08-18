import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";
import { portalMembers } from "./portal-members";

export const portalSessions = sqliteTable(
  "portal_sessions",
  {
    id: text("id").primaryKey(),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => portalMembers.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxPortalSessionsPortalId: index("idx_portal_sessions_portal_id").on(table.portalId),
    idxPortalSessionsMemberId: index("idx_portal_sessions_member_id").on(table.memberId),
    idxPortalSessionsExpiresAt: index("idx_portal_sessions_expires_at").on(table.expiresAt),
  })
);
