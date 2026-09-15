-- Phase 7.6.4/7.6.5: Multi-leg travel segments
CREATE TABLE IF NOT EXISTS itinerary_travel_legs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  segment_id INTEGER NOT NULL REFERENCES itinerary_segments(id) ON DELETE CASCADE,
  leg_order INTEGER NOT NULL,
  travel_mode TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  departure_at TEXT,
  arrival_at TEXT,
  origin_timezone TEXT,
  destination_timezone TEXT,
  operator TEXT,
  identifier TEXT,
  reference TEXT
);

CREATE INDEX IF NOT EXISTS idx_travel_legs_segment_id
  ON itinerary_travel_legs(segment_id);

CREATE INDEX IF NOT EXISTS idx_travel_legs_leg_order
  ON itinerary_travel_legs(segment_id, leg_order);
