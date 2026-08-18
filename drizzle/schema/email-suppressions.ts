import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const emailSuppressions = sqliteTable("email_suppressions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  suppressedType: text("suppressed_type").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
