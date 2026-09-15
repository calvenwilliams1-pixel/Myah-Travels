-- Phase 7.6.7: Member ban / revoke / unban
-- Adds status + ban metadata to portal_members.
-- banned ≠ deleted: banned members remain visible in admin, reversible.
ALTER TABLE portal_members ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE portal_members ADD COLUMN banned_at TEXT;
ALTER TABLE portal_members ADD COLUMN ban_reason TEXT;
ALTER TABLE portal_members ADD COLUMN link_revoked_at TEXT;
