import { sqliteTable, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { guides } from "./guides";
import { tags } from "./tags";

export const guideTags = sqliteTable(
  "guide_tags",
  {
    guideId: integer("guide_id")
      .notNull()
      .references(() => guides.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.guideId, table.tagId] }),
    idxGuideTagsTagId: index("idx_guide_tags_tag_id").on(table.tagId),
  })
);
