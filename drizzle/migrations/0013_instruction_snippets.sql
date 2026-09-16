-- Phase 7.8 Wave D: instruction snippets
CREATE TABLE IF NOT EXISTS instruction_snippets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS unq_instruction_snippets_title ON instruction_snippets(title);
