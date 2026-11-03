-- Batch I: media.is_library flag for library picker
-- Backfilled from in-session ALTER TABLE.

ALTER TABLE media ADD COLUMN is_library INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_media_library ON media(is_library, uploaded_at);
