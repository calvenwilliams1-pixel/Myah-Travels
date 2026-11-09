-- Batch M: onboarding + account lifecycle flags on users

ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN has_completed_setup INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

-- Partial index: fast lookup of "which accounts need onboarding"
CREATE INDEX idx_users_needs_setup ON users (has_completed_setup, is_active)
  WHERE has_completed_setup = 0 AND is_active = 1;
