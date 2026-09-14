-- Phase 7.6.2: Reference dropdown (replaces free-text confirmation label)
ALTER TABLE itinerary_segments ADD COLUMN reference_type TEXT;
ALTER TABLE itinerary_segments ADD COLUMN reference_label TEXT;
