-- Adds error_message column to email_queue.
-- Schema declared it but the actual table was missing it —
-- insert would fail with "no column named error_message"
-- because Drizzle's insert binding includes all declared columns.

ALTER TABLE email_queue ADD COLUMN error_message TEXT;
