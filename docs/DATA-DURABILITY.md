# Data Durability Model

Reference for what prevents data loss in this system, what's weak, and what needs fixing before launch.

## 1. FK Enforcement

**The app enables `PRAGMA foreign_keys = ON` per connection** (`lib/db/index.ts:22`). All Drizzle queries and server actions run with FK enforcement active.

**The `sqlite3` CLI runs with FK enforcement OFF.** SQLite defaults to OFF; only the app's connection turns it on. Consequences:
- Bash audit scripts using `sqlite3` test with FKs off — cascade/delete tests will get false results
- Cascade verification must use Node scripts importing `lib/db`, or vitest
- `scripts/audit/fk-audit.sh` verifies FK policy metadata and at-rest orphans, not runtime behavior

## 2. Current FK Policy State

34 total FK constraints. 20 explicit `ON DELETE` policies. 14 are `NO ACTION` (SQLite default).

### 2.1 Cascade (correct)

- `itineraries.portal_id` → portals
- `itinerary_sections.itinerary_id` → itineraries
- `itinerary_days.section_id` → itinerary_sections
- `itinerary_segments.day_id` → itinerary_days
- `itinerary_stays.section_id` → itinerary_sections
- `itinerary_travel_legs.segment_id` → itinerary_segments
- `itinerary_blocks.*` → itineraries / sections / days
- `portal_items.portal_id` → portals
- `portal_items.itinerary_id` → itineraries
- `notepad_entries.portal_id` → portals
- `person_notes.person_id` → people
- `person_trip_history.person_id` → people
- `folders.parent_id` → folders

### 2.2 Set Null (correct)

- `people.inquiry_id` → clients
- `person_notes.portal_id` → portals
- `person_trip_history.portal_id` → portals
- `portal_items.content_library_id` → content_library

### 2.3 NO ACTION — needs migration to CASCADE

Portal-scoped tables that should cascade but don't. App currently relies on soft-delete (`deleted_at`), which never fires FK enforcement.

| Table | Column | Target | Should be |
|---|---|---|---|
| portal_members | portal_id | portals.id | CASCADE |
| portal_magic_links | portal_id | portals.id | CASCADE |
| portal_sessions | portal_id | portals.id | CASCADE |
| portal_documents | portal_id | portals.id | CASCADE |
| portal_notices | portal_id | portals.id | CASCADE |
| portal_faqs | portal_id | portals.id | CASCADE |
| portal_checklist_states | portal_id | portals.id | CASCADE |
| portal_checklist_states | member_id | portal_members.id | CASCADE |

### 2.4 NO ACTION — likely intentional

| Table | Column | Target | Reason |
|---|---|---|---|
| client_attachments | client_id | clients.id | Attachments may outlive client. Review. |
| client_merges | merged_client_id | clients.id | Merge history. NO ACTION correct. |
| client_merges | primary_client_id | clients.id | Merge history. NO ACTION correct. |

## 3. App-Level Cleanup Behavior

- `deletePortalAction` → `softDeletePortal` (sets `deleted_at`, row remains). Children persist invisible to queries filtering `deleted_at IS NULL`. No data loss, but pile of orphan-on-paper children.
- `deleteMediaAction` → `softDeleteMedia`. Files referenced by URL in `posts.content` may 404 if physically deleted.
- `deleteFolder` → `softDeleteFolder` (manual cascade + `media.folder_id = NULL`)
- Itinerary deletes → soft-delete, children not DB-cascaded

## 4. Migration Plan for CASCADE Candidates

SQLite cannot `ALTER TABLE ... ALTER CONSTRAINT`. Three options:

### Option A — Drop-and-recreate table
Create new table with CASCADE FK, copy data, drop old, rename. Risk: window where table is unavailable.

### Option B — Trigger-based cascade (recommended)
Add an `AFTER DELETE` trigger on `portals` that manually deletes children. No table rebuild. Same effect as CASCADE. Recommended for production migration.

### Option C — Manual cleanup in delete actions
Explicit child deletes before soft-deleting parent. Simplest but not future-proof.

**Recommendation:** Option B for production, as Phase 7.7 migration.

## 5. Known Risks

### 5.1 Media file deletion breaks post rendering

Posts reference media by URL string, not FK. Deleting a `media` row (or its disk file) breaks any post whose content includes that URL. Currently:
- `deleteMediaAction` soft-deletes the row but leaves the disk file — post still renders
- If `scripts/cleanup-daily.sh` physically deletes soft-deleted files, posts will break
- **Fix:** add a "referenced by N posts" check on media delete, or never hard-delete media files

### 5.2 Folder deletion behavior

`softDeleteFolder` moves files to root, cascades to child folders. Verified working.

### 5.3 Itinerary deletion with attached portal_items

`portal_items.itinerary_id` is CASCADE. Hard-deleting an itinerary cascades to portal_items — item removed from portal wall. Currently itineraries use soft-delete, so FK never fires. Safe for now.

## 6. Recommended Workflow for Schema Changes

1. **Back up** — `scripts/backup.sh` (production) or `cp data/site.db data/site.db.pre-migration`
2. **Copy DB** — apply migration to copy first, never live
3. **Verify row counts** — before/after per table
4. **Verify FK state** — run `npm run audit` against copy
5. **Apply to production** — only if copy passes
6. **Post-migration audit** — `npm run audit` against production

No migration runs against production without a verified backup and a passing copy run.

## 7. Verification

`npm run audit` runs 7 suites, 157 checks:
- `content.sh` — public pages render block content
- `fk-audit.sh` — FK enforcement + policy + orphans
- `folders.sh` — folder CRUD, cascade, cycles
- `integrity.sh` — DB invariants, orphans, soft-delete leaks
- `media.sh` — media API, promote/demote, move
- `routes.sh` — every static page loads
- `wiring.sh` — every API resource has a UI caller

## 8. Phase 7.7 Migration TODO

- [ ] Add `cascade_portal_delete` trigger (Option B) via migration
- [ ] Audit media delete against post references
- [ ] Test migration workflow end-to-end on a copy
- [ ] Verify backup → restore round-trip on mini PC
- [ ] Confirm `deleteMediaAction` / `cleanup-daily.sh` protect referenced files
