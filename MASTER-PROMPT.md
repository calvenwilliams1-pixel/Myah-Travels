# MyCalTravels — MASTER-PROMPT.md (Revision 7)

**Purpose:** Restore context for a new AI assistant when conversation history is lost. This is the single-source-of-truth overview of the project.

---

I am building a website called **MyCalTravels** for a travel writer/agent (Myah). This document tells you where the project is, what we've decided, and what to do next.

**Read this first. Then read `CODE-PLAN.md` for the full file map.**

---

## Current Status (as of September 12, 2026)

**Architecture: Block-based content (posts) + Portal Wall (client delivery) + Itinerary Builder + Admin Notepad + Autosave infrastructure + Data Entry Automation (suggestion system, duplication, drag-reorder).**

The project has fully pivoted from Canvas/design tools to a block-based content system. Portal V1 and V2 backends are complete. Autosave infrastructure is complete with 48 passing tests. Phase 7.6 refinement pass COMPLETE (Waves 1-4). Phase 7.8 Data Entry Automation COMPLETE. Phase 7.9 (Post Editor and Writing Tools) COMPLETE. Phase 9 (Client Memory System) plan locked — see PHASES-7.9-AND-9-PLAN.md. Phase 8 (social publishing) deferred to post-launch. Phase 7.3 trimmed. Security audit flagged for launch prep.

**Core principle:**
> Developer controls design. Template controls layout. Writer controls content. Settings control brand. System controls hierarchy.

---

## The Pivot (Complete)

### Old Direction (Rejected)
- Canvas editor for writers
- Drag/resize/rotate elements
- Properties panels with colours/borders
- Freeform layout
- Moveable integration
- Full colour customisation (4 pickers)
- Standalone itinerary PDF pipeline
- Merging data sources on the wall
- Notices feature (removed)

### New Direction (Implemented)
- **Block-based posts** (10 blocks: Title, Body, Callout, Hero, Image, Gallery, QuickFacts, Quote, ProsCons, Verdict)
- **Portal Wall** for client trip delivery (content library + portal-specific + itinerary items, unified pipeline)
- **Admin Preview** bypass for rapid iteration
- **Curated colour palettes** (not free-form pickers)
- **Hero presets** (8 named options, no colour pickers)
- **Unified wall pipeline** via `portal_items`
- **Itinerary Builder** (sections, days, segments, stays)
- **Admin Notepad** (per-portal scratchpad with people tagging)
- **Autosave infrastructure** (draft durability, 48 tests)

---

## Phase 7.8 — Data Entry Automation (Design Rationale)

Purpose: reduce typing on 150-250 segment itineraries. Deterministic only — no AI at runtime, no external APIs.

### The two-layer suggestion system

**Layer 1 — Entity memory** (`entities` table). A named real-world thing: hotel, airline, operator, city. Carries **identity** fields (address, phone, city, country — never change) and **defaults** (check-in 15:00, check-out 11:00 — usually constant, editable). Keyed by `(kind, canonical_name)`. One entity per real-world thing.

**Layer 2 — Field value memory** (`field_values` table). Every input column remembers every distinct value it has seen. Keyed by `(field_key, value)`. Field keys are `{record}.{field}` format (e.g. `stay.hotel_name`, `leg.origin`) and are typed constants in `lib/suggestions/field-keys.ts` — nothing writes a literal string.

**Static supplements.** `data/airports.json` and `data/airlines.json` ship as committed snapshots (dev seeds now, regenerable via `scripts/fetch-static-data.js`). Reason: airports have a slow-converging tail — Myah touches one-off IATA codes that never repeat, so learned memory alone leaves cold-start gaps for months.

### The three field tiers

Protects her from silent overwrites:

| Tier | Behavior | Example |
|------|----------|---------|
| Identity | Auto-filled from entity. Bold. | Hotel address |
| Default | Prefilled, editable. Tagged "suggested". | Check-in time 15:00 |
| Occurrence | Never auto-filled. | Dates, booking refs |

**Touched protection:** entity accept hydrates only fields that are *currently empty*. If she already typed Address, accepting a hotel does not overwrite it.

### Ranking

Default: entities > statics > field values. Override in `field-keys.ts` for `leg.origin` / `leg.destination` — a field value with `use_count >= 5` outranks statics (personal pattern beats generic list once it is clearly a pattern). Within each source: exact > prefix > substring, then `use_count DESC`, `last_used_at DESC`. Field values filtered to `use_count >= 2` for display only — everything is stored.

### Drag-reorder design

Stakeholder override of the SRS "no manual reordering" guardrail. Ships as opt-in.

- `itinerary_segments.manual_position` (nullable integer)
- `itinerary_days.order_mode` ("time" | "manual", default "time")
- Sort: always by `manual_position` when present, fall back to time. `order_mode` is a **UI flag** (show drag handles), not the sort source. This dissolves the "all positions cleared" edge case.
- Positions gapped by 1000. Scoped to `(day_id, time_bucket)` — dragging reorders within morning/afternoon/evening.
- Time edits that move a segment to a new bucket **clear its manual_position**.
- Duplicates and bulk-added segments arrive with `manual_position = null` — fall through to time.
- Disagreement indicator (⚠) in editor only when manual order diverges from time order.
- `DELETE /api/days/[id]/order` resets to time order.

### Undo strategy

**Global undo/redo is Phase 7.3.** Phase 7.8 bulk ops are all-or-nothing transactional — the interim substitute. Every bulk op calls `recordOperation(type, affectedIds, metadata)` from `lib/operations/record.ts` (currently a stub logging in dev). When Phase 7.3 ships, the stub becomes the write path to a real undo table — pointer swap, not retrofit.

### Bulk-add (Wave C, pending)

Dedicated transactional endpoint `POST /api/days/[id]/segments/bulk`, all-or-nothing. Pipe-delimited lines with tab-separated accepted. Client-side preview table mandatory before commit. Textarea contents persist to localStorage. Batch endpoint must validate against the same Zod schemas as single-add.

### Rejected outright

| Feature | Reason |
|---------|--------|
| Segment grouping | Conflicts with time-derived ordering |
| Fill-down across multi-selected | Requires multi-select UI that doesn't exist |
| Diff view for day duplication | Duplication is transactional and deterministic |
| Undo scoped to bulk ops only | Global undo is Phase 7.3 |
| AI/LLM at runtime | Unnecessary for bounded data; latency, cost, privacy |
| Fuzzy matching for entity dedup | False-positive merge silently attaches wrong address to a booking |
| Learned combinations with occurrence data | Occurrence data changes every trip |

### Deferred

- Cross-itinerary "Copy from…" modal UI (backend ready)
- Paste booking confirmation regex parser
- Instruction snippets (reuse Content Library, don't add new system)
- Inline location picker (redundant once autocomplete proves sufficient)
- Entity cleanup admin page
- FTS5 migration on `field_values` (scale-out when > 100K rows)

### Reviewer trail

Two rounds of external review shaped this design. Key decisions attributed:

- **Wave A split into A1 (defaults, validation) and A2 (autocomplete + statics)** — don't let low-risk wins wait on a new client component
- **`use_count >= 2` filter is display-only** — nothing is lost; typos are stored but not suggested
- **Drag-reorder design** (nullable position, bucket-scoped, gapped, order_mode as UI flag not sort source) came from the second review
- **Per-field ranking override** for `leg.origin`/`leg.destination` at `use_count >= 5`
- **Backfill normalization** (trim + collapse + title-case, `source = 'migration'`, `use_count` from frequency)
- **Undo-log-ready pattern** — bulk ops record affected row IDs at commit time even before Phase 7.3 exists
- **Q10 answer was "cut drag-and-drop"** — overridden by stakeholder decision; recorded for the trail

---

## Architecture at a Glance

### Block System (Posts)
- `BlockType` = discriminated union of 10 content types
- `BLOCK_REGISTRY` maps type → editor + renderer
- `BlockEditor.tsx` = vertical editor with live preview
- Renderers receive `{ data, style }` — TemplateStyle has all design

### Template System (Posts)
- Templates define which blocks are allowed + order
- `TemplateSection` has `label` + `state` (required/optional/disabled)
- `TemplateCreator.tsx` = admin UI
- `template-store.ts` = DB persistence (`contentType: "post"`)

### Portal Wall (Client Delivery)
- **Content Library** (`content_library`) — reusable content, categories for filtering only
- **Portal Items** (`portal_items`) — unified pipeline with `source_type`: `library` | `portal_specific` | `itinerary`
- **Wall** (`/portal/[slug]`) — renders items by `type`: pdf | image | text | itinerary
- **Hero Banner** — title, subtitle, image, preset (image takes precedence)
- **Admin Preview** — `/admin/portals/[id]/preview` uses admin session
- **Magic Link Auth** — client access (unchanged)

### Itinerary Builder (V1 Shipped)
- Separate content type, not Portal Blocks (chronology-driven, not prominence-driven)
- Travel segments carry flight data (no separate flights table)
- Stays belong to one section, sequential only
- Time-derived ordering (no manual reorder)
- Empty days render intentional placeholder
- Print stylesheet export (no PDF pipeline)
- Attached to wall via `portal_items.source_type='itinerary'`
- Admin editor split into 9 focused components
- Inline forms replace all `prompt()` dialogs
- Section date constraints propagate to stays and days

### Admin Notepad (V1 Shipped)
- Admin-only per-portal scratchpad
- Comma-separated tags (V1); People table trigger defined for V2
- Never rendered to clients
- Logistics notes only (no diagnostic detail)
- Search by content or tag
- Autocomplete from portal members + previously-used tags

### Autosave Infrastructure
- `useAutosaveField` hook (critical data-integrity code)
- Multi-value in-flight dedup via `Map<T, number>`
- Version gating (stale responses ignored)
- Mount gating (React state only; refs + localStorage always update)
- Durability layer (`lib/drafts`) with localStorage draft persistence
- 4 form primitives: AutosaveTextField, AutosaveDateField, AutosaveTimeField, AutosaveSelectField
- Save indicator component
- **48 tests passing** (15 autosave + 14 durability + 19 storage)

### Theme System
- Semantic tokens: primary, secondary, accent, success, warning, danger, info
- RGB CSS variables for opacity support
- ThemeProvider wraps public + admin
- Admin settings: Primary + Accent only
- 6 curated palettes
- 8 hero presets
- Secondary auto-derived from primary
- Background fixed white (professional standard)
- Status colours fixed

---

## Phase Status

| Phase | Status | What |
|-------|--------|------|
| 1 | ✅ Complete | TypeScript interfaces + BlockRegistry + 10 blocks |
| 2 | ✅ Complete | Vertical block editor + template selector + live preview |
| 3 | ✅ Complete | 3 starter templates + PostRenderer + Template Creator |
| 4 | ✅ Complete | Theme system (semantic tokens, palettes, no colour pickers) |
| 5 | ✅ Complete | Portal V1 (content library + wall + hero + preview) |
| 6.1 | ✅ Complete | Quick wins (hero presets 3→8, tile icons, notices removed, member names) |
| 6.2 | ✅ Complete | Itinerary Builder V1 (schema, backend, admin UI, client view, wall integration) |
| 6.3 | ✅ Complete | Admin Notepad (schema, backend, UI, search, autocomplete) |
| 6.4A | ✅ Complete | Notepad verified + admin itinerary preview |
| 6.4B | ✅ Complete | Autosave hook + durability layer + 48 tests |
| 6.4C | ✅ Complete | 4 form primitives |
| 6.4D | ✅ Complete | Replace `prompt()` with inline forms (580 → 17 lines) |
| **7** | **🔄 Current** | **Bug-fix pass from live testing** |
| 7.3 | ⏳ Pending | Production hardening (Canvas deletion, deployment fixes) |
| 8 | ⏳ Future | V2 features (Options segments, cruise mode, People table) |

---

## Canvas System

**FROZEN. Not deleted. To be removed when block editor is fully approved.**

Keep for potential: template previews (temporary), reference for migration.

No new Canvas features. Canvas colour migration deferred (39 emerald remain in frozen files).

---

## Database

**Important:** `schema.sql` is outdated and does not reflect all current columns. Use `scripts/setup-db.js` for fresh setup:
1. Applies `schema.sql` base
2. Applies migrations (`drizzle/migrations/`)
3. Adds missing columns that aren't in `schema.sql` yet

**Key tables:**
- `users`, `sessions` — admin auth
- `posts`, `guides`, `reviews`, `tags`, `categories` — content
- `templates` — Canvas + block templates
- `portals` — client portals with hero fields
- `content_library` — reusable content
- `portal_items` — unified wall pipeline
- `portal_members`, `portal_magic_links`, `portal_sessions` — client auth
- `itineraries`, `itinerary_sections`, `itinerary_days`, `itinerary_segments`, `itinerary_stays` — itinerary builder
- `notepad_entries` — admin scratchpad
- `settings`, `media`, `clients`, `activity_log`, `email_queue` — system

**Migrations:**
- `0001_fts5_triggers.sql`
- `0002_portal_content_library.sql`
- `0003_itinerary.sql` (includes portal_items CHECK constraint rebuild)
- `0004_notepad.sql`

---

## Known Issues

1. **better-sqlite3 crash in Codespace** — Environment-specific. Native module crashes after multiple server-action saves. **Does not occur on local PC.** Workflow: edit in Codespace, test locally.

2. **Canvas system frozen** — 39 hardcoded emerald remain. Pending deletion.

3. **`schema.sql` outdated** — Missing newer columns. `scripts/setup-db.js` handles all known cases.

4. **Native date/time pickers** — Chromium date/time inputs highlight text instead of opening the picker. Fix in Phase 7 (needs `showPicker()` fallback).

5. **Segment edits revert on collapse** — Itinerary segment fields lose unsaved edits when collapsed. Fix in Phase 7 (SegmentRow lifecycle).

6. **Background colour fixed white** — Dark mode deferred indefinitely.
7. **Phase 7.8 code shipped but untested on local** — Waves A + B implemented; full test pass pending (see TESTING.md).
8. **Cross-itinerary copy backend ready, UI deferred** — `/api/itineraries/[targetId]/copy-segment` works; the 3-step picker modal is not built.

---

## Development Workflow

- **Editing:** Codespace (VS Code, Python heredocs, Copilot)
- **Testing:** Local PC (no better-sqlite3 crash, real browser at localhost:3000)
- **Sync:** `git push` from Codespace → `git pull` on local → test → report bugs

---

## Testing Commands

```bash
# Local first-time setup
node scripts/setup-db.js   # Create DB
npm run seed               # Seed data

# Daily
npm run dev                # Dev server (port 3000)
npm run build              # Production build
npm start                  # Production server

# Tests
npm test                   # All vitest tests (48 passing)
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
```

**Note:** `.env` needs `RESEND_API_KEY=re_dummy_key_for_dev` (dummy value OK in dev) for admin pages to load.

---

## Guardrails (Do Not Violate)

| Guardrail | Applies To |
|-----------|-----------|
| No raw colour pickers | Hero presets are named options |
| No per-segment styling | Itinerary colours derive from type + theme |
| No free icon picker | Content tile icons are fixed enum |
| No manual reordering | Itinerary segments ordered by time |
| No CMS-style versioning | Live edits, snapshot exports |
| Notepad never leaks to client | Admin-only scoping |
| No attendees on segments | People tagging lives only in Notepad |
| Stays belong to one section | No cross-section stays |
| Empty days render placeholder | Never blank |
| Flights = Travel segments | No separate hierarchy |
| No merged data sources | Unified via `portal_items` |
| No PDF pipeline | Print stylesheet only |
| Autosave never blocks editing | localStorage failures swallowed |
| React state gated by mount | Refs + localStorage always update |

---

## Current Focus: Phase 9 Client Memory, then Local Testing

Phase 9 is next. Phase 7.9 (editor + writing tools) is fully shipped.

### Phase 7.9 — COMPLETE
Rich text toolbar (bold, italic, underline, colour with presets + raw picker, highlight, font family 12 curated, font size presets + fine-tune, alignment, lists, links, blockquote, HR, clear formatting), sticky grouped toolbar, keyboard shortcuts, word count + reading time, right-click context menu, paste sanitization, colour presets system (global, create/overwrite), pop-out preview + fullscreen, YouTube paste auto-embed, social handles settings page.

Commits: A1-A3 + B1-B2, all in main.

### Phase 9 — Client Memory System
people table (canonical, email unique, optional inquiry link), person_notes (global or trip-scoped via nullable portal_id), person_trip_history (survives portal purge), portal member add with autocomplete from people, /admin/clients/[personId] person page with global notes + trip history tabs, /admin/clients search dashboard, Forget this client action (PIPEDA). Automatic portal purge at return_date + 90 days (configurable, per-portal override via keep_until). Itinerary Library: archived itineraries stay editable, reusable as templates, filterable live/archived/template.

### Testing debt
Everything since Phase 7.6 Wave 2 is untested in a browser. TESTING.md has the full checklist covering 7.6, 7.8, 7.9, and 9 when it ships.
## Future Work (Prioritised)

### Phase 7.3 — Production Hardening
- Delete Canvas system
- Fix better-sqlite3 crash on mini PC deployment
- Preview popup (modal → floating → fullscreen)
- Target surface token conversion
- Undo/Redo, Publish Validation, Error Boundaries

### Phase 8 — V2 Features
- **Itinerary V2:** Options segments, cruise mode, overlapping stays, group splits
- **People & Tagging V2:** People table (triggered), per-person lookup, PII isolation
- **Portal:** Client reply capability, global announcements, docs acknowledgment
- **Content:** Template migration (Canvas → Block), inline editing

### Low Priority
- Dark mode (reader preference)
- Template versioning
- Reading time / word count
- Additional block types (20+ threshold before registry refactor)

---

## What to Do When Resuming

1. **Read this document** (MASTER-PROMPT.md)
2. **Read `CODE-PLAN.md`** for the complete file map
3. **Read `TODO.md`** for the current checklist
4. **Read `SRS Plan`** for the full specification
5. **Check git log** to see the most recent commits and current branch state
6. **Confirm with the user** which Phase 7 batch to work on next

---

## Questions to Ask the User

If context is unclear, ask:

- **"Which Phase 7 batch are we working on?"** (Bugs, constraints, portal manager, UI polish, segment UX, or download)
- **"Do you want me to work in Codespace or should we test locally first?"** (Edit in Codespace, test on local PC)
- **"Any new bugs from your last test session?"** (Bugs supersede planned work)
- **"Shall I run the tests to confirm 48 still passing?"** (Sanity check after any changes)

---

## How the User Wants Me to Work

1. **Never change a file without reading it first.**
2. **Never assume functions exist.** Verify by reading actual code.
3. **Never strip previous features for quick fixes.**
4. **No time constraints.** Do it once, properly, with the bells and whistles.
5. **Ultimate goal: convenience and polish for Myah.**
6. **Use Python heredocs in Codespace** for file edits (`python3 << 'PYEOF' ... PYEOF`).
7. **BATCH PATTERN — do not verify after every command.**
   - Give commands in batches (numbered, one after another).
   - The user runs the whole batch without pasting back intermediate output.
   - Then run **one blanket verification pass** at the end of the batch.
   - Then commit.
   - Do NOT ask the user to paste output for each individual command. It slows everything down.
   - If a command in the batch fails silently, the blanket verify catches it.
8. **Verify with:** `npx tsc --noEmit --pretty false 2>&1 | grep "error TS" | wc -l` → expect `0`, plus `npm test 2>&1 | grep -E "Test Files|Tests"` → expect `48 passed (48)`.
9. **Commit frequently** with clear messages. Push to GitHub after each lump.
10. **Verify scripts actually ran** — grep for the expected change in the file to confirm, don't trust success messages.
11. **Ask for help from reviewers** (365, Claude) when facing architectural decisions.

### Heredoc hygiene (learned the hard way)

- **Long Python heredocs with many string literals corrupt on paste.** Prefer smaller batches or write the script to `/tmp/x.py` first, then run it.
- **Never embed triple-backticks inside a Python heredoc whose target file contains markdown code fences.** The shell sees the inner ` ``` ` as the end of the heredoc. Use `~~~` in the markdown content instead, or placeholder tokens swapped after reading.
- **`str.replace()` fails silently.** Always print `[OK]` / `[FAIL]` per replacement so a batch verify can catch missed anchors.
- **`count()` counts occurrences, not lines.** For "remove import lines" tasks, operate on `readlines()` and filter by substring, not `str.count()`.
- **Git push occasionally reports a false rejection** (race condition on ref lock) when the push actually succeeded. Check `git log origin/main --oneline -2` before retrying.

---

**Last Updated:** September 12, 2026