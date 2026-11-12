-- 2e-1b: harden tag_aliases constraints.
--
-- Recreates the table so canonical_tag_id uses ON DELETE RESTRICT (was CASCADE).
-- With RESTRICT, the DB itself refuses to delete a tag that aliases point at,
-- even if a caller bypasses deleteCanonicalSafe. CASCADE stays on alias_tag_id
-- so deleting an alias tag cleanly removes its alias row.
--
-- Adds four triggers to enforce the flat model at DB level:
--   - BEFORE INSERT: reject alias-of-alias (canonical is itself an alias)
--   - BEFORE INSERT: reject alias-that-has-aliases (would create chain)
--   - BEFORE UPDATE OF alias_tag_id, canonical_tag_id: same two checks
--
-- Assumes PRAGMA foreign_keys = ON, which lib/db/index.ts sets. The app-side
-- pragma is verified by a test in lib/tags/aliases.test.ts.

CREATE TABLE tag_aliases_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias_tag_id INTEGER NOT NULL UNIQUE REFERENCES tags(id) ON DELETE CASCADE,
  canonical_tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE RESTRICT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CHECK (alias_tag_id <> canonical_tag_id)
);

INSERT INTO tag_aliases_new (id, alias_tag_id, canonical_tag_id, created_at)
  SELECT id, alias_tag_id, canonical_tag_id, created_at FROM tag_aliases;

DROP TABLE tag_aliases;

ALTER TABLE tag_aliases_new RENAME TO tag_aliases;

CREATE INDEX idx_tag_aliases_canonical ON tag_aliases(canonical_tag_id);

CREATE TRIGGER tag_aliases_prevent_alias_of_alias_insert
BEFORE INSERT ON tag_aliases
FOR EACH ROW
WHEN (SELECT COUNT(*) FROM tag_aliases WHERE alias_tag_id = NEW.canonical_tag_id) > 0
BEGIN
  SELECT RAISE(ABORT, 'Cannot alias to a tag that is itself an alias');
END;

CREATE TRIGGER tag_aliases_prevent_chain_insert
BEFORE INSERT ON tag_aliases
FOR EACH ROW
WHEN (SELECT COUNT(*) FROM tag_aliases WHERE canonical_tag_id = NEW.alias_tag_id) > 0
BEGIN
  SELECT RAISE(ABORT, 'Cannot make a tag an alias if it already has aliases');
END;

CREATE TRIGGER tag_aliases_prevent_alias_of_alias_update
BEFORE UPDATE OF alias_tag_id, canonical_tag_id ON tag_aliases
FOR EACH ROW
WHEN (NEW.canonical_tag_id != OLD.canonical_tag_id
      AND (SELECT COUNT(*) FROM tag_aliases WHERE alias_tag_id = NEW.canonical_tag_id AND id != NEW.id) > 0)
BEGIN
  SELECT RAISE(ABORT, 'Cannot alias to a tag that is itself an alias');
END;

CREATE TRIGGER tag_aliases_prevent_chain_update
BEFORE UPDATE OF alias_tag_id, canonical_tag_id ON tag_aliases
FOR EACH ROW
WHEN (NEW.alias_tag_id != OLD.alias_tag_id
      AND (SELECT COUNT(*) FROM tag_aliases WHERE canonical_tag_id = NEW.alias_tag_id AND id != NEW.id) > 0)
BEGIN
  SELECT RAISE(ABORT, 'Cannot make a tag an alias if it already has aliases');
END;
