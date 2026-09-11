-- ============================================
-- ITINERARY TABLES
-- ============================================

CREATE TABLE itineraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX idx_itineraries_portal_id ON itineraries(portal_id);
CREATE INDEX idx_itineraries_deleted_at ON itineraries(deleted_at);

CREATE TABLE itinerary_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  base_city TEXT,
  start_date TEXT,
  end_date TEXT,
  position INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sections_itinerary_id ON itinerary_sections(itinerary_id);

CREATE TABLE itinerary_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES itinerary_sections(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  day_number INTEGER NOT NULL,
  title TEXT,
  notes TEXT,
  position INTEGER DEFAULT 0
);

CREATE INDEX idx_days_section_id ON itinerary_days(section_id);

CREATE TABLE itinerary_segments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_id INTEGER NOT NULL REFERENCES itinerary_days(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('activity', 'travel', 'meal', 'free_day')),
  start_time TEXT,
  end_time TEXT,
  title TEXT NOT NULL,
  location TEXT,
  instructions TEXT,
  confirmation TEXT,
  departure_airport TEXT,
  arrival_airport TEXT,
  departure_datetime TEXT,
  arrival_datetime TEXT,
  airline TEXT,
  flight_number TEXT,
  position INTEGER DEFAULT 0
);

CREATE INDEX idx_segments_day_id ON itinerary_segments(day_id);

CREATE TABLE itinerary_stays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES itinerary_sections(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  address TEXT,
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  check_in_time TEXT,
  check_out_time TEXT,
  notes TEXT
);

CREATE INDEX idx_stays_section_id ON itinerary_stays(section_id);

-- ============================================
-- REBUILD portal_items TO ALLOW 'itinerary' source_type
-- SQLite cannot drop/modify a CHECK constraint in place.
-- ============================================

PRAGMA foreign_keys = OFF;

CREATE TABLE portal_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  portal_id INTEGER NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'library' CHECK (source_type IN ('library', 'portal_specific', 'itinerary')),
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
  id, portal_id, source_type, content_library_id, title, description,
  type, category, file_path, text_content, position, created_at
)
SELECT
  id, portal_id, source_type, content_library_id, title, description,
  type, category, file_path, text_content, position, created_at
FROM portal_items;

DROP TABLE portal_items;

ALTER TABLE portal_items_new RENAME TO portal_items;

CREATE INDEX idx_portal_items_portal_id ON portal_items(portal_id);
CREATE INDEX idx_portal_items_position ON portal_items(portal_id, position);

PRAGMA foreign_keys = ON;
