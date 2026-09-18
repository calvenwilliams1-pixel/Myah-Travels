# MyCalTravels — MASTER-PROMPT.md (Revision 10)

**Purpose:** Restore context for a new AI assistant when conversation history is lost. This is the single-source-of-truth overview of the project.

---

I am building a website called **MyCalTravels** for a travel writer/agent (Myah). This document tells you where the project is, what we've decided, and what to do next.

**Read this first. Then read `docs/CODE-PLAN.md` for the full file map.**

---

## Current Status (as of September 18, 2026)

**Architecture:** Block-based content (posts) + Portal Wall (client delivery) + Itinerary Builder + Admin Notepad + Autosave infrastructure + Data Entry Automation + Client Memory System + Picture-in-Picture preview.

All planned phases (7.6, 7.8, 7.9, 9, 9.5) are **code-complete**. The current work is a **large accumulated-testing pass** — features were shipped in sequence without incremental browser verification, and the testing debt is being worked off. See `docs/TESTING.md` for the checklist.

**Recently completed (September 18 session):**
- TipTap rendering bug closed: replaced `@tiptap/html` (zeed-dom drops inline styles) with `getSchema` + `DOMSerializer` + jsdom on server, browser `document` on client
- Shared extension module `lib/editor/extensions.ts` — single source of truth, no more editor/renderer drift
- Canvas-in-TipTap removed entirely (CanvasBlockNode, CanvasBlockRenderer, CanvasBlockComponent, InsertCanvasBlockButton, TipTapRenderer)
- Content schema versioning: `lib/editor/body-content.ts` envelope wrapping
- Render test suite: `components/editor/renderers/CleanTipTapRenderer.test.tsx` (26 tests)
- Toolbar rewrite with gradient tiles, icon labels, key props, size picker persistence, link command fix
- Divider extension with thickness + colour attributes, config popover
- Context menu submenus for colour/size/font
- Picture-in-Picture preview via `useDocumentPiP` (real OS window, draggable across monitors)
- `useFocusRestore` cleanup on unmount
- Smoke scripts relocated from `tests/` → `scripts/smoke/`, `npm run smoke` registered
- `React.cache` removed from `lib/auth/index.ts` (Next.js coupling removed)
- Docs consolidated into `docs/` folder, `code plan.md` → `docs/CODE-PLAN.md`
- README rewritten for current reality

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
- **Data Entry Automation** (suggestion system, duplication, drag-reorder)
- **Client Memory System** (people, notes, trip history, portal purge)
- **Picture-in-Picture preview** (real OS window, draggable across monitors)

---

## Rendering Architecture (Important — Learned the Hard Way)

The TipTap render path is **not** `@tiptap/html`'s `generateHTML`.

### Why
`generateHTML` uses `zeed-dom` internally — a partial DOM implementation for edge runtimes. It **silently drops inline styles** produced by `addGlobalAttributes` extensions (Color, FontFamily, custom FontSize) when multiple extensions contribute to the same mark (`textStyle`). The symptom was raw JSON leaking into the DOM on styled content because `generateHTML` threw, and the catch fell through to `html = content`.

### The Correct Path

```ts
import { getSchema } from "@tiptap/core";
import { DOMSerializer, Node as PMNode } from "prosemirror-model";
import { buildExtensions } from "@/lib/editor/extensions";

const schema = getSchema(buildExtensions());
const serializer = DOMSerializer.fromSchema(schema);

// Server: jsdom-provided detached document. Client: real document.
// See CleanTipTapRenderer.tsx.
const pmDoc = PMNode.fromJSON(schema, json);
const fragment = serializer.serializeFragment(pmDoc.content, { document });
const container = doc.createElement("div");
container.appendChild(fragment);
const html = container.innerHTML;
```

### The Rule

**All renderers must import `buildExtensions` from `lib/editor/extensions.ts`.** Do not maintain parallel extension lists. If the editor can produce a node or mark, every renderer must be able to render it — otherwise the whole class of bug returns.

### Content Schema Versioning

`BodyData.tiptapJson` is now a versioned envelope:
- Current: `{"version": 1, "content": <TipTap JSON>}`
- Legacy: bare TipTap JSON, still readable via `deserializeBodyContent`
- New writes go through `serializeBodyContent` in `BodyBlockEditor`

Read via `deserializeBodyContent(data.tiptapJson)` in `BodyRenderer`. `getBodyContentVersion` exists for future migrations.

---

## Phase 7.8 — Data Entry Automation (Design Rationale)

Purpose: reduce typing on 150-250 segment itineraries. Deterministic only — no AI at runtime, no external APIs.

### The two-layer suggestion system

**Layer 1 — Entity memory** (`entities` table). A named real-world thing: hotel, airline, operator, city. Carries **identity** fields (address, phone, city, country) and **defaults** (check-in 15:00). Keyed by `(kind, canonical_name)`.

**Layer 2 — Field value memory** (`field_values` table). Every input column remembers every distinct value it has seen. Keyed by `(field_key, value)`. Field keys are `{record}.{field}` format and typed constants in `lib/suggestions/field-keys.ts`.

**Static supplements.** `data/airports.json` and `data/airlines.json` ship as committed snapshots.

### The three field tiers

| Tier | Behavior | Example |
|------|----------|---------|
| Identity | Auto-filled from entity. Bold. | Hotel address |
| Default | Prefilled, editable. Tagged "suggested". | Check-in time 15:00 |
| Occurrence | Never auto-filled. | Dates, booking refs |

### Drag-reorder design

- `itinerary_segments.manual_position` (nullable integer)
- `itinerary_days.order_mode` ("time" | "manual", default "time")
- Sort: always by `manual_position` when present, fall back to time
- Positions gapped by 1000, scoped to `(day_id, time_bucket)`

### Rejected outright

| Feature | Reason |
|---------|--------|
| Segment grouping | Conflicts with time-derived ordering |
| Fill-down across multi-selected | Requires multi-select UI that doesn't exist |
| AI/LLM at runtime | Unnecessary for bounded data |
| Fuzzy matching for entity dedup | False-positive merge silently attaches wrong address |

---

## Architecture at a Glance

### Block System (Posts)
- `BlockType` = discriminated union of 10 content types
- `BLOCK_REGISTRY` maps type → editor + renderer
- `BlockEditor.tsx` = vertical editor with live preview
- Renderers receive `{ data, style }`

### Template System (Posts)
- Templates define which blocks are allowed + order
- `TemplateSection` has `label` + `state` (required/optional/disabled)
- `template-store.ts` = DB persistence (`contentType: "post"`)
- **Templates table can contain legacy Canvas rows — `loadTemplatesFromDb` filters them out**

### Portal Wall (Client Delivery)
- **Content Library** (`content_library`) — reusable content
- **Portal Items** (`portal_items`) — unified pipeline with `source_type`: `library` | `portal_specific` | `itinerary`
- **Wall** (`/portal/[slug]`) — renders items by `type`: pdf | image | text | itinerary
- **Hero Banner** — title, subtitle, image, preset
- **Admin Preview** — `/admin/portals/[id]/preview`
- **Magic Link Auth** — client access

### Itinerary Builder
- Separate content type, not Portal Blocks
- Travel segments carry flight data (no separate flights table)
- Stays belong to one section, sequential only
- Time-derived ordering (or manual with `order_mode: "manual"`)
- Print stylesheet export (no PDF pipeline)
- Attached to wall via `portal_items.source_type='itinerary'`

### Admin Notepad
- Admin-only per-portal scratchpad
- Comma-separated tags; People table trigger defined for V2
- Never rendered to clients
- Search by content or tag

### Autosave Infrastructure
- `useAutosaveField` hook
- Multi-value in-flight dedup via `Map<T, number>`
- Version gating (stale responses ignored)
- Mount gating (React state only; refs + localStorage always update)
- Durability layer (`lib/drafts`) with localStorage draft persistence
- 4 form primitives: AutosaveTextField, AutosaveDateField, AutosaveTimeField, AutosaveSelectField

### Theme System
- Semantic tokens: primary, secondary, accent, success, warning, danger, info
- RGB CSS variables for opacity support
- 6 curated palettes
- 8 hero presets
- Background fixed white
- Status colours fixed

### Picture-in-Picture Preview
- `useDocumentPiP` hook wraps `documentPictureInPicture`
- Real OS window, draggable across monitors
- Uses React portal into the PiP window's document
- Stylesheets + theme CSS vars copied on open
- Escape inside PiP window closes it (separate keydown listener)
- Falls back cleanly on unsupported browsers (Firefox, Safari)

---

## Phase Status

| Phase | Status | What |
|-------|--------|------|
| 1 | ✅ Complete | TypeScript interfaces + BlockRegistry + 10 blocks |
| 2 | ✅ Complete | Vertical block editor + template selector + live preview |
| 3 | ✅ Complete | 3 starter templates + PostRenderer + Template Creator |
| 4 | ✅ Complete | Theme system |
| 5 | ✅ Complete | Portal V1 |
| 6.1-6.4D | ✅ Complete | Quick wins, Itinerary V1, Notepad, Autosave |
| 7 | ✅ Complete | All 6 bug-fix batches |
| 7.5 | Partial | Singapore Demo seeded; Japan+Cruise+Singapore pending |
| 7.6 | ✅ Complete | Waves 1-4 |
| 7.8 | ✅ Complete | Data Entry Automation |
| 7.9 | ✅ Complete | Post Editor and Writing Tools |
| 9 | ✅ Complete | Client Memory System |
| 9.5 | ✅ Complete | Polish Pass + Security Audit |
| **Testing pass** | **🔄 Current** | **Browser verification of everything since 7.6 Wave 2** |
| 7.3 | ⏳ Pending | Publish validation, error boundaries, responsive preview |
| 8 | ⏳ Future | Options segments, cruise mode, People table |

---

## Canvas System

**FROZEN. Not deleted. Unwired.**

Canvas-in-TipTap was fully removed (CanvasBlockNode, CanvasBlockRenderer, CanvasBlockComponent, InsertCanvasBlockButton, TipTapRenderer). The remaining Canvas editor files (`components/editor/canvas/`, `app/admin/(dashboard)/homepage/`) are:
- Not linked from any nav
- Only reachable via `mode === "design"` branches in the three admin edit pages — DB has no rows with that mode
- Safe to leave; will be deleted when confirmed unnecessary

---

## Database

**Important:** `schema.sql` is outdated. Use `scripts/setup-db.js` for fresh setup:
1. Applies `schema.sql` base
2. Applies migrations (`drizzle/migrations/`)
3. Adds missing columns
4. Seeds colour presets
5. Seeds block templates

**Key tables:**
- `users`, `sessions` — admin auth
- `posts`, `guides`, `reviews`, `tags`, `categories` — content
- `templates` — Canvas + block templates (**filter legacy Canvas rows on load**)
- `portals` — client portals with hero fields
- `content_library` — reusable content
- `portal_items` — unified wall pipeline
- `portal_members`, `portal_magic_links`, `portal_sessions` — client auth
- `itineraries`, `itinerary_sections`, `itinerary_days`, `itinerary_segments`, `itinerary_stays` — itinerary builder
- `notepad_entries` — admin scratchpad
- `entities`, `field_values` — suggestion system (7.8)
- `people`, `person_notes`, `person_trip_history` — client memory (9)
- `settings`, `media`, `clients`, `activity_log`, `email_queue` — system

**Migrations:** 0001-0010 in `drizzle/migrations/`

---

## Known Issues

1. **better-sqlite3 crash in Codespace** — Environment-specific. Not present on local PC (Node 22) or mini PC deployment. Workflow: edit in Codespace, test locally.

2. **Canvas system frozen** — Legacy files in `components/editor/canvas/`. Unwired from nav and TipTap. Not reachable. Pending deletion when confirmed unnecessary.

3. **`schema.sql` outdated** — Use `scripts/setup-db.js`.

4. **Codespace Node version** — Codespace runs Node 24; local runs Node 22 LTS. Minor drift; both work. Local is the deployment-target version.

---

## Development Workflow

- **Editing:** Codespace (VS Code, Python heredocs, Copilot)
- **Testing:** Local PC (Node 22, no better-sqlite3 crash, real browser at localhost:3000)
- **Sync:** `git push` from Codespace → `git pull` on local → test → report bugs

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
npm test                   # All vitest tests (87 passing)
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
npm run smoke              # Operational smoke scripts (needs populated DB)
```

**Note:** `.env` needs `RESEND_API_KEY=re_dummy_key_for_dev` (dummy value OK in dev) for admin pages to load.

---

## Guardrails (Do Not Violate)

| Guardrail | Applies To |
|-----------|-----------|
| No raw colour pickers on surfaces | Hero presets are named options. **Exception:** inline text/highlight in Body block uses curated presets + raw picker |
| No per-segment styling | Itinerary colours derive from type + theme |
| No free icon picker | Content tile icons are fixed enum |
| No manual reordering | Itinerary segments ordered by time (or explicit manual via order_mode) |
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
| **All renderers import `buildExtensions`** | No parallel extension lists |
| **Never use `@tiptap/html`'s `generateHTML`** | zeed-dom drops inline styles |

---

## Current Focus: Local Testing, then Launch Day Prep

All code is complete. The active work is:

1. **Local testing pass** — accumulated debt from Phase 7.6 Wave 2 onward. `docs/TESTING.md` has the full checklist.
2. **Phase 7.7 Launch Day** — email + magic link config, cron entries, first TOTP setup, security verify
3. **Phase 7.3 (trimmed)** — publish validation, error boundaries, responsive preview
4. **Phase 8** — social publishing (post-launch)

### Testing debt

Everything since Phase 7.6 Wave 2 has been verified only by `tsc` + `npm test` + DB smoke tests. Browser-level UI verification is the current work.

Recent additions since the last testing pass:
- Toolbar gradient tiles + icon labels
- Divider config popover (thickness + colour)
- Context menu submenus (colour/size/font)
- Picture-in-Picture preview
- Content schema versioning (body content envelope)
- Editor body content now written via `serializeBodyContent`

---

## What to Do When Resuming

1. **Read this document** (`docs/MASTER-PROMPT.md`)
2. **Read `docs/CODE-PLAN.md`** for the complete file map
3. **Read `docs/TESTING.md`** for the current checklist
4. **Check git log** to see the most recent commits
5. **Confirm with the user** which area to work on next

---

## Questions to Ask the User

If context is unclear, ask:

- **"Are we working on testing, launch prep, or a new feature?"**
- **"Do you want me to work in Codespace or should we test locally first?"**
- **"Any new bugs from your last test session?"** (Bugs supersede planned work)
- **"Shall I run the tests to confirm 87 still passing?"**

---

## How the User Wants Me to Work

1. **Never change a file without reading it first.**
2. **Never assume functions exist.** Verify by reading actual code.
3. **Never strip previous features for quick fixes.**
4. **No time constraints.** Do it once, properly, with the bells and whistles.
5. **Ultimate goal: convenience and polish for Myah.**
6. **Use Python heredocs in Codespace** for file edits.
7. **BATCH PATTERN — do not verify after every command.**
   - Give commands in batches (numbered, one after another).
   - The user runs the whole batch without pasting back intermediate output.
   - Then run **one blanket verification pass** at the end of the batch.
   - Then commit.
   - Do NOT ask the user to paste output for each individual command.
   - If a command in the batch fails silently, the blanket verify catches it.
8. **Verify with:** `npx tsc --noEmit --pretty false 2>&1 | grep "error TS" | wc -l` → expect `0`, plus `npm test 2>&1 | grep -E "Test Files|Tests"` → expect `87 passed (87)`.
9. **Commit frequently** with clear messages.
10. **Verify scripts actually ran** — grep for the expected change in the file to confirm, don't trust success messages.
11. **Ask for help from reviewers** (Claude, Copilot) when facing architectural decisions.
12. **No deferrals by the assistant.** The user defers, not the assistant. If something needs doing, do it.

### Heredoc hygiene (learned the hard way)

- **Use ````` as a placeholder for triple-backtick fences** in Python heredocs, then `.replace("```", "\`\`\`")` before writing. Literal triple-backticks inside heredocs corrupt on paste.
- **Long Python heredocs with many string literals corrupt on paste.** Prefer smaller batches or write the script to `/tmp/x.py` first, then run it.
- **`str.replace()` fails silently.** Always print `[OK]` / `[FAIL]` per replacement so a batch verify can catch missed anchors.
- **Never write `"\\n"` in a Python heredoc** passed through bash — it becomes a literal `
` in the file, breaking JSON. Use `"
"` (single backslash).
- **Git push occasionally reports a false rejection** (race condition on ref lock) when the push actually succeeded. Check `git log origin/main --oneline -2` before retrying.
- **Check verification output before committing.** Green tests + green tsc are necessary but not sufficient — grep the file for the expected new code.
- **The `cat > file <<'EOF'` heredoc pattern fails at ~50+ lines with high frequency in Codespace.** Use Python heredocs for full-file writes instead.

---

**Last Updated:** September 18, 2026
