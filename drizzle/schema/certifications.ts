import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const certifications = sqliteTable("certifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  organization: text("organization"),
  yearEarned: text("year_earned"),
  imagePath: text("image_path"),
  displayOrder: integer("display_order").default(0),
  isVisible: integer("is_visible", { mode: "boolean" }).default(true),
  deletedAt: text("deleted_at"),
});
