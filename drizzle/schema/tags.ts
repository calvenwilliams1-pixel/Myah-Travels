import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  isFavourite: integer("is_favourite", { mode: "boolean" }).default(false),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
