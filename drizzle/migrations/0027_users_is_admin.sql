-- Batch M.0: is_admin flag. Existing rows default 0; promotion via seed-admin --promote.
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;
