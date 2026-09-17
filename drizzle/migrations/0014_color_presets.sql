-- Phase 7.9: colour presets for the post editor
CREATE TABLE IF NOT EXISTS color_presets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  hex TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS unq_color_presets_name_kind ON color_presets(name, kind);
CREATE INDEX IF NOT EXISTS idx_color_presets_kind_position ON color_presets(kind, position);
