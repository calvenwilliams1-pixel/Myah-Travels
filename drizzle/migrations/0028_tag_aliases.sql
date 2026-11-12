-- 2e-1: flat tag alias model.
-- A tag is EITHER canonical (may have aliases) OR an alias (points at one
-- canonical). Never both. No chains. Enforced at DB level for the invariants
-- that SQL can express; app-level for the rest (see lib/tags/aliases.ts).

CREATE TABLE tag_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alias_tag_id INTEGER NOT NULL UNIQUE REFERENCES tags(id) ON DELETE CASCADE,
  canonical_tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  CHECK (alias_tag_id <> canonical_tag_id)
);

CREATE INDEX idx_tag_aliases_canonical ON tag_aliases(canonical_tag_id);
