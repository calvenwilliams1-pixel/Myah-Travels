import { sqliteTable, integer, primaryKey, index } from "drizzle-orm/sqlite-core";
import { posts } from "./posts";
import { tags } from "./tags";

export const postTags = sqliteTable(
  "post_tags",
  {
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
    idxPostTagsTagId: index("idx_post_tags_tag_id").on(table.tagId),
  })
);
