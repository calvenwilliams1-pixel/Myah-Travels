-- Phase 7.8 Wave A closeout: telemetry
CREATE TABLE IF NOT EXISTS suggestion_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_key TEXT NOT NULL,
  event TEXT NOT NULL,
  value_preview TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suggestion_events_field_key ON suggestion_events(field_key);
CREATE INDEX IF NOT EXISTS idx_suggestion_events_event ON suggestion_events(event);
CREATE INDEX IF NOT EXISTS idx_suggestion_events_created_at ON suggestion_events(created_at);
