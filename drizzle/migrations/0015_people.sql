-- Phase 9A: people, person notes, trip history
-- Plus: portal_members.person_id, portals.keep_until, itineraries nullable portal_id + is_archived

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  canonical_name TEXT,
  inquiry_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS unq_people_email ON people(email);
CREATE INDEX IF NOT EXISTS idx_people_canonical_name ON people(canonical_name);

CREATE TABLE IF NOT EXISTS person_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  portal_id INTEGER REFERENCES portals(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_person_notes_person_id ON person_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_person_notes_portal_id ON person_notes(portal_id);

CREATE TABLE IF NOT EXISTS person_trip_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  portal_id INTEGER REFERENCES portals(id) ON DELETE SET NULL,
  itinerary_id INTEGER,
  trip_title TEXT NOT NULL,
  trip_start_date TEXT,
  trip_end_date TEXT,
  destination TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_person_trip_history_person_id ON person_trip_history(person_id);
CREATE INDEX IF NOT EXISTS idx_person_trip_history_portal_id ON person_trip_history(portal_id);

-- Note: SQLite ALTER TABLE cannot add a column with a non-constant default
-- to an existing table directly via this script on all versions. The
-- setup-db.js guard adds the columns individually. Rows already present
-- keep is_archived = 0 (default false). portal_id stays as-is; existing
-- values are preserved.

ALTER TABLE portal_members ADD COLUMN person_id INTEGER;
ALTER TABLE portals ADD COLUMN keep_until TEXT;
ALTER TABLE itineraries ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;
