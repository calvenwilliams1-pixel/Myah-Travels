import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

/**
 * Devices that have passed TOTP once and are trusted to skip the code
 * prompt at login for 30 days (the password is still required every
 * time). The id is the SHA-256 hash of the device token; the raw token
 * lives only in the browser's httpOnly cookie. Rows are revoked when
 * the user changes their password.
 */
export const trustedDevices = sqliteTable(
  "trusted_devices",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userAgent: text("user_agent"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    expiresAt: text("expires_at").notNull(),
    lastUsedAt: text("last_used_at"),
  },
  (table) => ({
    idxTrustedDevicesUserId: index("idx_trusted_devices_user_id").on(table.userId),
    idxTrustedDevicesExpiresAt: index("idx_trusted_devices_expires_at").on(table.expiresAt),
  })
);
