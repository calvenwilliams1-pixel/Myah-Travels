-- Phase 7.8: Data Entry Automation
-- Suggestion system foundation.

ALTER TABLE itinerary_segments ADD COLUMN manual_position INTEGER;

CREATE TABLE IF NOT EXISTS entities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  identity TEXT NOT NULL,
  defaults TEXT,
  source TEXT NOT NULL DEFAULT 'user',
  use_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS unq_entities_kind_name
  ON entities(kind, canonical_name);
CREATE INDEX IF NOT EXISTS idx_entities_search
  ON entities(kind, use_count DESC, last_used_at DESC);

CREATE TABLE IF NOT EXISTS field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_key TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'user',
  use_count INTEGER NOT NULL DEFAULT 1,
  last_used_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS unq_field_values_key_value
  ON field_values(field_key, value);
CREATE INDEX IF NOT EXISTS idx_field_values_search
  ON field_values(field_key, use_count DESC, last_used_at DESC);
