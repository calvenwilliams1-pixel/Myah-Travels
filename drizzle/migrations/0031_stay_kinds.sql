-- Stay kinds (Phase 8 Batch 1): a stay is a hotel, a resort, or a cruise.
-- The ship's name rides in hotel_name for cruises (it is the display name
-- every existing view already reads); kind-specific facts get their own
-- columns. Existing rows are hotels by default.
ALTER TABLE itinerary_stays ADD COLUMN kind TEXT NOT NULL DEFAULT 'hotel';
ALTER TABLE itinerary_stays ADD COLUMN cruise_line TEXT;
ALTER TABLE itinerary_stays ADD COLUMN cabin TEXT;
ALTER TABLE itinerary_stays ADD COLUMN deck TEXT;
ALTER TABLE itinerary_stays ADD COLUMN embark_port TEXT;
ALTER TABLE itinerary_stays ADD COLUMN disembark_port TEXT;
ALTER TABLE itinerary_stays ADD COLUMN resort_brand TEXT;
ALTER TABLE itinerary_stays ADD COLUMN meal_plan TEXT;
ALTER TABLE itinerary_stays ADD COLUMN transfers_included INTEGER;
ALTER TABLE itinerary_stays ADD COLUMN transfers_note TEXT;
