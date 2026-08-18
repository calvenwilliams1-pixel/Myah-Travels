import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const redirects = sqliteTable("redirects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  oldSlug: text("old_slug").notNull().unique(),
  newSlug: text("new_slug").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
