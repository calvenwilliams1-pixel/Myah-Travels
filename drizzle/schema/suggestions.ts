import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================================
// SUGGESTION SYSTEM (Phase 7.8)
// ============================================================

export const entities = sqliteTable(
  "entities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind").notNull(),
    canonicalName: text("canonical_name").notNull(),
    identity: text("identity").notNull(),
    defaults: text("defaults"),
    source: text("source").notNull().default("user"),
    useCount: integer("use_count").notNull().default(1),
    lastUsedAt: text("last_used_at").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unqKindName: uniqueIndex("unq_entities_kind_name").on(table.kind, table.canonicalName),
    idxSearch: index("idx_entities_search").on(table.kind, table.useCount, table.lastUsedAt),
  })
);

export const fieldValues = sqliteTable(
  "field_values",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fieldKey: text("field_key").notNull(),
    value: text("value").notNull(),
    source: text("source").notNull().default("user"),
    useCount: integer("use_count").notNull().default(1),
    lastUsedAt: text("last_used_at").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unqKeyValue: uniqueIndex("unq_field_values_key_value").on(table.fieldKey, table.value),
    idxSearch: index("idx_field_values_search").on(table.fieldKey, table.useCount, table.lastUsedAt),
  })
);
