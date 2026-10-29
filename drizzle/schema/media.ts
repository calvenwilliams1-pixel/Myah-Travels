import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const media = sqliteTable(
  "media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    filePath: text("file_path").notNull(),
    fileName: text("file_name"),
    fileType: text("file_type"),
    fileSize: integer("file_size"),
    folder: text("folder"),
    altText: text("alt_text"),
    caption: text("caption"),
    uploadedAt: text("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
    isLibrary: integer("is_library", { mode: "boolean" }).notNull().default(false),
    folderId: integer("folder_id"),
  },
  (table) => ({
    idxMediaFolder: index("idx_media_folder").on(table.folder),
    idxMediaDeletedAt: index("idx_media_deleted_at").on(table.deletedAt),
    idxMediaLibrary: index("idx_media_library").on(table.isLibrary, table.uploadedAt),
    idxMediaFolderId: index("idx_media_folder_id").on(table.folderId),
  })
);
