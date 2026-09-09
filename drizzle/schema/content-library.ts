import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const contentLibrary = sqliteTable(
  "content_library",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    description: text("description"),
    type: text("type").notNull(),
    category: text("category"),
    filePath: text("file_path"),
    textContent: text("text_content"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxCategory: index("idx_content_library_category").on(table.category),
    idxType: index("idx_content_library_type").on(table.type),
    idxDeletedAt: index("idx_content_library_deleted_at").on(table.deletedAt),
  })
);
