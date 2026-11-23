-- Promo portal: one permanent portal for potential clients. Its
-- magic links and sessions never expire and the purge job skips it.
-- Additive flag; existing portals are unaffected.
ALTER TABLE portals ADD COLUMN is_promo INTEGER DEFAULT 0;
