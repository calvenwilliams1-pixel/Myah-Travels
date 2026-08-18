import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const revisions = sqliteTable(
  "revisions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    contentType: text("content_type").notNull(),
    contentId: integer("content_id").notNull(),
    revisionData: text("revision_data").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxRevisionsContentTypeId: index("idx_revisions_content_type_id").on(table.contentType, table.contentId),
  })
);
