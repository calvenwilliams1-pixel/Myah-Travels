import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const assets = sqliteTable("assets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filePath: text("file_path").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  width: integer("width"),
  height: integer("height"),
  altText: text("alt_text"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  deletedAt: text("deleted_at"),
});
