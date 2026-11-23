-- Phase 8 Batch 3: a cruise stay can carry the port list parsed from
-- its booking confirmation (one port per line), so "Lay out sailing
-- days" can prefill from it instead of asking for the list again.
ALTER TABLE itinerary_stays ADD COLUMN ports_list TEXT;
