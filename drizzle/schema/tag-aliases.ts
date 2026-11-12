import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { tags } from "./tags";

export const tagAliases = sqliteTable(
  "tag_aliases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    aliasTagId: integer("alias_tag_id")
      .notNull()
      .unique()
      .references(() => tags.id, { onDelete: "cascade" }),
    canonicalTagId: integer("canonical_tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxCanonical: index("idx_tag_aliases_canonical").on(table.canonicalTagId),
  })
);
