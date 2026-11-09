import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    totpSecret: text("totp_secret"),
    totpEnabled: integer("totp_enabled", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    lastLogin: text("last_login"),
    mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(false),
    hasCompletedSetup: integer("has_completed_setup", { mode: "boolean" }).notNull().default(true),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxUsersDeletedAt: index("idx_users_deleted_at").on(table.deletedAt),
  })
);
