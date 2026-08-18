import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";
import { portalMembers } from "./portal-members";

export const portalMagicLinks = sqliteTable(
  "portal_magic_links",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => portalMembers.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"),
    revokedAt: text("revoked_at"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxPortalMagicLinksPortalId: index("idx_portal_magic_links_portal_id").on(table.portalId),
    idxPortalMagicLinksMemberId: index("idx_portal_magic_links_member_id").on(table.memberId),
    idxPortalMagicLinksToken: index("idx_portal_magic_links_token").on(table.token),
    idxPortalMagicLinksExpiresAt: index("idx_portal_magic_links_expires_at").on(table.expiresAt),
  })
);
