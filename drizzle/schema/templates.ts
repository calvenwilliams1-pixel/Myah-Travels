import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const templates = sqliteTable("templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  layoutData: text("layout_data").notNull(),
  version: integer("version").default(1),
  createdFromTemplateId: integer("created_from_template_id"),
  thumbnailAssetId: integer("thumbnail_asset_id"),
  isBuiltIn: integer("is_built_in", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at"),
  deletedAt: text("deleted_at"),
});
