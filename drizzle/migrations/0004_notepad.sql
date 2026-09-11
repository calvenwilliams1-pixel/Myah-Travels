-- ============================================
-- ADMIN NOTEPAD
-- ============================================

CREATE TABLE notepad_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tags TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX idx_notepad_portal_id ON notepad_entries(portal_id);
CREATE INDEX idx_notepad_deleted_at ON notepad_entries(deleted_at);
