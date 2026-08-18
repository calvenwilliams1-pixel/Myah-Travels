import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const relatedContent = sqliteTable(
  "related_content",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sourceType: text("source_type").notNull(),
    sourceId: integer("source_id").notNull(),
    targetType: text("target_type").notNull(),
    targetId: integer("target_id").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxRelatedContentSource: index("idx_related_content_source").on(table.sourceType, table.sourceId),
    idxRelatedContentTarget: index("idx_related_content_target").on(table.targetType, table.targetId),
  })
);
