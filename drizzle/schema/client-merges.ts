import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { clients } from "./clients";

export const clientMerges = sqliteTable(
  "client_merges",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    primaryClientId: integer("primary_client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    mergedClientId: integer("merged_client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    mergedAt: text("merged_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxClientMergesPrimary: index("idx_client_merges_primary").on(table.primaryClientId),
    idxClientMergesMerged: index("idx_client_merges_merged").on(table.mergedClientId),
  })
);
