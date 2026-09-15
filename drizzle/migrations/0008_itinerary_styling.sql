-- Phase 7.6.9: Itinerary styling
-- Three inheritance levels: site -> itinerary -> section.
-- Graphic blocks get their own palette override.

ALTER TABLE itineraries ADD COLUMN theme_preset TEXT;
ALTER TABLE itinerary_sections ADD COLUMN theme_preset_override TEXT;
ALTER TABLE itinerary_segments ADD COLUMN is_highlighted INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS itinerary_blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  section_id INTEGER REFERENCES itinerary_sections(id) ON DELETE CASCADE,
  day_id INTEGER REFERENCES itinerary_days(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  slot TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  image_url TEXT,
  image_alt TEXT,
  text_content TEXT,
  variant TEXT,
  size TEXT NOT NULL DEFAULT 'medium',
  palette_override TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CHECK (section_id IS NOT NULL OR day_id IS NOT NULL),
  CHECK (NOT (section_id IS NOT NULL AND day_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_itinerary_id ON itinerary_blocks(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_section_id ON itinerary_blocks(section_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_day_id ON itinerary_blocks(day_id);
