import { sqliteTable, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { reviews } from "./reviews";
import { tags } from "./tags";

export const reviewTags = sqliteTable(
  "review_tags",
  {
    reviewId: integer("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.reviewId, table.tagId] }),
    idxReviewTagsTagId: index("idx_review_tags_tag_id").on(table.tagId),
  })
);
