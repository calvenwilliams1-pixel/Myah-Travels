import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { clients } from "./clients";

export const clientAttachments = sqliteTable(
  "client_attachments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    fileName: text("file_name"),
    fileType: text("file_type"),
    uploadedAt: text("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxClientAttachmentsClientId: index("idx_client_attachments_client_id").on(table.clientId),
  })
);
