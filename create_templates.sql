CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL,
  layout_data TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_from_template_id INTEGER,
  thumbnail_asset_id INTEGER,
  user_id INTEGER,
  is_built_in INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE UNIQUE INDEX idx_templates_slug ON templates(slug);
