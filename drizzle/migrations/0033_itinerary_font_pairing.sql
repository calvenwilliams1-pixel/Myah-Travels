-- Per-itinerary font pairing (Settings-fonts follow-up, Nov 23, 2026).
-- NULL means "use the site-wide font_pairing setting"; a value is
-- one of the curated pairing ids in lib/theme/font-pairings.ts.
-- Additive only — safe on live data, applies any time.
ALTER TABLE itineraries ADD COLUMN font_pairing TEXT;
