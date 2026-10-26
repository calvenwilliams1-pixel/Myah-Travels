-- Glance vs full rendering for itinerary items on the portal wall.
ALTER TABLE portal_items ADD COLUMN variant TEXT NOT NULL DEFAULT 'full';
