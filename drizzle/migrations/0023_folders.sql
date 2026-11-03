-- Batch J1: folders table + media.folder_id
-- Backfilled from in-session direct DDL (was applied via ALTER TABLE,
-- never captured as a migration). Fresh installs now have folders.

CREATE TABLE folders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  parent_id INTEGER REFERENCES folders(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_deleted_at ON folders(deleted_at);

ALTER TABLE media ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;
CREATE INDEX idx_media_folder_id ON media(folder_id);
