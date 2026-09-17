import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============================================================
// COLOUR PRESETS (Phase 7.9)
// Named swatches for the post editor's text and highlight pickers.
// Curated defaults are seeded once (guarded by a settings flag).
// Myah can overwrite existing presets or create new ones.
// ============================================================

export const colorPresets = sqliteTable(
  "color_presets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    hex: text("hex").notNull(),
    // "text" | "highlight"
    kind: text("kind").notNull().default("text"),
    // True when this row currently matches the curated seed value
    // (flips to false on overwrite). Restore re-applies the code
    // constant regardless of this flag.
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
    // Soft-delete. Deactivated presets stay in the table but are
    // filtered from the picker.
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    position: integer("position").notNull().default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
  },
  (table) => ({
    unqNameKind: uniqueIndex("unq_color_presets_name_kind").on(table.name, table.kind),
    idxKindPosition: index("idx_color_presets_kind_position").on(table.kind, table.position),
  })
);
