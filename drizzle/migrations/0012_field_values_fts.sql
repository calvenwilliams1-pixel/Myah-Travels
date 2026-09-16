-- Phase 7.8 Wave D: FTS5 index on field_values
-- Provides an alternative search path for large tables. The existing
-- LIKE query stays the primary path; FTS5 kicks in above a threshold.

CREATE VIRTUAL TABLE IF NOT EXISTS field_values_fts USING fts5(
  field_key,
  value,
  content='field_values',
  content_rowid='id'
);

-- Backfill existing rows
INSERT INTO field_values_fts(field_values_fts) VALUES('rebuild');

-- Keep the FTS index in sync
CREATE TRIGGER IF NOT EXISTS field_values_ai AFTER INSERT ON field_values BEGIN
  INSERT INTO field_values_fts(rowid, field_key, value) VALUES (new.id, new.field_key, new.value);
END;

CREATE TRIGGER IF NOT EXISTS field_values_ad AFTER DELETE ON field_values BEGIN
  INSERT INTO field_values_fts(field_values_fts, rowid, field_key, value) VALUES('delete', old.id, old.field_key, old.value);
END;

CREATE TRIGGER IF NOT EXISTS field_values_au AFTER UPDATE ON field_values BEGIN
  INSERT INTO field_values_fts(field_values_fts, rowid, field_key, value) VALUES('delete', old.id, old.field_key, old.value);
  INSERT INTO field_values_fts(rowid, field_key, value) VALUES (new.id, new.field_key, new.value);
END;
