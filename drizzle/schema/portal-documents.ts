import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { portals } from "./portals";

export const portalDocuments = sqliteTable(
  "portal_documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portalId: integer("portal_id")
      .notNull()
      .references(() => portals.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    filePath: text("file_path").notNull(),
    fileName: text("file_name"),
    fileType: text("file_type"),
    uploadedAt: text("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxPortalDocumentsPortalId: index("idx_portal_documents_portal_id").on(table.portalId),
  })
);
