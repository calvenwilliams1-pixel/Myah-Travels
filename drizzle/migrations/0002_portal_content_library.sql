-- ============================================
-- CONTENT LIBRARY
-- ============================================

CREATE TABLE content_library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'image', 'text')),
  category TEXT CHECK (category IN ('guide', 'checklist', 'faq', 'alert', 'document', 'other')),
  file_path TEXT,
  text_content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX idx_content_library_category ON content_library(category);
CREATE INDEX idx_content_library_type ON content_library(type);
CREATE INDEX idx_content_library_deleted_at ON content_library(deleted_at);

-- ============================================
-- PORTAL ITEMS
-- ============================================

CREATE TABLE portal_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'library' CHECK (source_type IN ('library', 'portal_specific')),
  content_library_id INTEGER REFERENCES content_library(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT,
  type TEXT CHECK (type IN ('pdf', 'image', 'text')),
  category TEXT CHECK (category IN ('guide', 'checklist', 'faq', 'alert', 'document', 'other')),
  file_path TEXT,
  text_content TEXT,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portal_items_portal_id ON portal_items(portal_id);
CREATE INDEX idx_portal_items_position ON portal_items(portal_id, position);

-- ============================================
-- PORTALS HERO FIELDS
-- ============================================

ALTER TABLE portals ADD COLUMN hero_title TEXT;
ALTER TABLE portals ADD COLUMN hero_subtitle TEXT;
ALTER TABLE portals ADD COLUMN hero_image TEXT;
ALTER TABLE portals ADD COLUMN hero_preset TEXT DEFAULT 'minimal';
