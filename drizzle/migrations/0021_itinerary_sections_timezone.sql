-- Per-section timezone. Null means "inherit from itinerary.timezone".
-- Used by Day by Day to compute "today" per the section the client is currently in.
ALTER TABLE itinerary_sections ADD COLUMN timezone TEXT;
