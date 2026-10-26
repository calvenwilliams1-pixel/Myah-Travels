-- Expand portal_items.source_type to allow new itinerary-derived tile types.
-- SQLite cannot ALTER TABLE ... DROP/ADD CONSTRAINT on CHECK; requires table rebuild.
-- Preserves all existing columns except the (reverted) variant column.
-- Preserves all original CHECK constraints on type and category.

PRAGMA foreign_keys = OFF;

BEGIN;

CREATE TABLE portal_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'library'
    CHECK (source_type IN (
      'library', 'portal_specific',
      'itinerary', 'itinerary_glance', 'itinerary_today'
    )),
  content_library_id INTEGER REFERENCES content_library(id) ON DELETE SET NULL,
  itinerary_id INTEGER REFERENCES itineraries(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  type TEXT CHECK (type IN ('pdf', 'image', 'text')),
  category TEXT CHECK (category IN ('guide', 'checklist', 'faq', 'alert', 'document', 'other')),
  file_path TEXT,
  text_content TEXT,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO portal_items_new (
  id, portal_id, source_type, content_library_id, itinerary_id,
  title, description, type, category, file_path, text_content,
  position, created_at
)
SELECT
  id, portal_id, source_type, content_library_id, itinerary_id,
  title, description, type, category, file_path, text_content,
  position, created_at
FROM portal_items;

DROP TABLE portal_items;
ALTER TABLE portal_items_new RENAME TO portal_items;

CREATE INDEX idx_portal_items_portal_id ON portal_items(portal_id);
CREATE INDEX idx_portal_items_position ON portal_items(portal_id, position);

COMMIT;

PRAGMA foreign_keys = ON;
