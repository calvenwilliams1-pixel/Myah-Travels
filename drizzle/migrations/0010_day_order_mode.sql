-- Phase 7.8 Wave B: day-level ordering mode
-- "time"   — sort segments by startTime (default)
-- "manual" — sort segments by manualPosition, fall back to startTime

ALTER TABLE itinerary_days ADD COLUMN order_mode TEXT NOT NULL DEFAULT 'time';
