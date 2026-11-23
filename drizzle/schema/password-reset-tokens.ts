import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

/**
 * Single-use password reset tokens for admin accounts. The id is the
 * SHA-256 hash of the token; the raw token lives only in the emailed
 * reset link. Requesting a new link deletes the user's previous tokens,
 * and a successful reset deletes them all. Rows are also revoked
 * (deleted) whenever the password changes by any other route.
 */
export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => ({
    idxPasswordResetTokensUserId: index("idx_password_reset_tokens_user_id").on(table.userId),
    idxPasswordResetTokensExpiresAt: index("idx_password_reset_tokens_expires_at").on(table.expiresAt),
  })
);
