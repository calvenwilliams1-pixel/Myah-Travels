# MyCalTravels — MASTER-PROMPT.md (Revision 3)

**Purpose:** Restore context for a new AI assistant when conversation history is lost. This is the single-source-of-truth overview of the project.

---

I am building a website called **MyCalTravels** for a travel writer/agent (Myah). This document tells you where the project is, what we've decided, and what to do next.

**Read this first. Then read `CODE-PLAN.md` for the full file map.**

---

## Current Status (as of September 12, 2026)

**Architecture: Block-based content (posts) + Portal Wall (client delivery) + Itinerary Builder + Admin Notepad + Autosave infrastructure.**

The project has fully pivoted from Canvas/design tools to a block-based content system. Portal V1 and V2 backends are complete. Autosave infrastructure is complete with 48 passing tests. We are currently in Phase 7 (bug-fix pass from live testing).

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

## Current Focus: Phase 7 Bug Fixes

Live testing surfaced these issues (prioritized):

### Batch 1 — Critical
- **Bug 1:** Segment edits revert when collapsed/re-expanded
- **Bug 2:** Admin preview → click itinerary → "session expired" (should route to admin preview)
- **Bug 3:** Date/time inputs highlight instead of opening picker (need `showPicker()`)

### Batch 2 — Date Constraints
- Section date pickers constrained to portal departure/return
- Segment date pickers constrained to day date
- Flight datetime buffer allowance
- Make all non-essential form fields optional

### Batch 3 — Portal Manager UX
- Trashcan + confirmation on portal rows
- Recovery view for soft-deleted portals
- "Preview Wall" icon in portal manager rows + detail page

### Batch 4 — UI Polish
- Restyle itinerary tile (less empty space)
- Replace `alert()` with styled toast
- Explicit Save button (alongside autosave)
- Custom date/time pickers (bigger, more colorful)

### Batch 5 — Segment UX
- Clarify segment type / day title relationship
- Fix time picker responsiveness
- Fix AM/PM switching

### Batch 6 — Download
- Verify PDF download works
- Consider admin-side download button

---

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
7. **Verify after every change** with `npx tsc --noEmit --pretty false 2>&1 | grep "error TS" | wc -l` → expect `0`.
8. **Commit frequently** with clear messages. Push to GitHub after each phase.
9. **Verify scripts actually ran** — grep for the expected change in the file to confirm, don't trust success messages.
10. **Ask for help from reviewers** (365, Claude) when facing architectural decisions.

---

**Last Updated:** September 12, 2026