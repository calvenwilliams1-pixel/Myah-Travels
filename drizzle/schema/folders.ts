import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const folders = sqliteTable(
  "folders",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    parentId: integer("parent_id"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxFoldersParent: index("idx_folders_parent").on(table.parentId),
    idxFoldersDeletedAt: index("idx_folders_deleted_at").on(table.deletedAt),
  })
);

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
