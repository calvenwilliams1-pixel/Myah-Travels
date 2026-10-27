-- IANA timezone per itinerary. Used by Day by Day to compute "today"
-- in the trip's local time. Null means "Auto" — falls back to the
-- first travel leg's destinationTimezone, then UTC.
ALTER TABLE itineraries ADD COLUMN timezone TEXT;
