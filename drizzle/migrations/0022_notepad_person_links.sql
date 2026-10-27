-- Structured tag → person mapping for notepad entries.
-- JSON array of {tag, personId} objects. Null = no links (legacy or no match).
-- Person page is at /admin/clients/people/[personId] (Phase 9 layout).
ALTER TABLE notepad_entries ADD COLUMN person_links TEXT;
