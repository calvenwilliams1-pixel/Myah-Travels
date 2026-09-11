# MyCalTravels - MASTER-PROMPT.md (Revision 2)

I am building a website called "MyCalTravels" for a travel writer/agent (Myah).

---

## Current Status

**Architecture: Content Blocks (posts) + Portal Wall (client delivery) + Template Creator + Theme System.**

The project has fully pivoted from Canvas/design tools to a block-based content system for posts, and a separate Portal Wall system for client trip delivery. Both use semantic theme tokens.

**Core principle:** Developer controls design. Template controls layout. Writer controls content. Settings control brand. System controls hierarchy.

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

### New Direction (Implemented)
- **Block-based posts** (10 blocks: Title, Body, Callout, Hero, Image, Gallery, QuickFacts, Quote, ProsCons, Verdict)
- **Portal Wall** for client trip delivery (content library + portal-specific items)
- **Admin Preview** bypass for rapid iteration
- **Curated colour palettes** (not free-form pickers)
- **Hero presets** (named options, no colour pickers)
- **Unified wall pipeline** via `portal_items`

---

## Architecture

### Block System (Posts)
- `BlockType` = discriminated union of 10 content types
- `BLOCK_REGISTRY` maps type → editor + renderer
- `BlockEditor.tsx` = vertical editor with live preview
- Renderers receive `{ data, style }` — TemplateStyle has all design

### Template System (Posts)
- Templates define which blocks are allowed + order
- `TemplateSection` has `label` + `state` (required/optional/disabled)
- `TemplateCreator.tsx` = admin UI
- `template-store.ts` = DB persistence (contentType: "post")

### Portal Wall System (Client Delivery)
- **Content Library** (`content_library`) — reusable content, categories for filtering only
- **Portal Items** (`portal_items`) — unified pipeline with `source_type`: `library` | `portal_specific` | `itinerary`
- **Wall** (`/portal/[slug]`) — renders items by `type`: pdf | image | text | itinerary
- **Hero Banner** — title, subtitle, image, preset (fallback)
- **Admin Preview** — `/admin/portals/[id]/preview` uses admin session
- **Magic Link Auth** — unchanged from V1 (client access)

### Theme System
- Semantic tokens: primary, secondary, accent, success, warning, danger, info
- RGB CSS variables for opacity support
- ThemeProvider wraps public + admin
- Admin settings: Primary + Accent only
- 6 curated palettes
- Secondary auto-derived from primary
- Background fixed white (professional standard)
- Status colours fixed

### Itinerary System (V2 — in planning)
- Separate content type, not Portal Blocks (chronology vs prominence)
- Travel segments carry flight data (no separate flights table)
- Stays belong to one section, sequential only
- Time-derived ordering (no manual reorder)
- Empty days render intentionally
- Print stylesheet export (no PDF pipeline)
- Attached to wall via `portal_items.source_type='itinerary'`

### Admin Notepad (V2 — in planning)
- Admin-only per-portal scratchpad
- Comma-separated tags (V1), People table (V2 trigger)
- Never rendered to clients
- Logistics notes only

---

## MVP Phases

| Phase | Status | What |
|-------|--------|------|
| 1 | ✅ Complete | TypeScript interfaces + BlockRegistry + 10 blocks |
| 2 | ✅ Complete | Vertical block editor + template selector + live preview |
| 3 | ✅ Complete | 3 starter templates + PostRenderer + Template Creator |
| 4 | ✅ Complete | Theme system (semantic tokens, palettes, no colour pickers) |
| 5 | ✅ Complete | Portal V1 (content library + wall + hero + preview) |
| 6 | ⏳ Current | Portal V2 (itinerary builder + admin notepad) |
| 7 | ⏳ Future | Post-V2 (Options segments, cruise mode, People table) |

---

## Canvas System

**FROZEN. Not deleted. To be removed when block editor is fully approved.**

Keep for potential:
- Template previews (temporary)
- Reference for migration

No new Canvas features. Canvas colour migration deferred (39 emerald remain).

---

## Key Files

### Block System (Posts)
- `types/blocks.ts` — Block types + TemplateSection + TemplateStyle
- `lib/blocks/registry.ts` — BLOCK_REGISTRY (10 blocks)
- `lib/blocks/templates.ts` — Starter templates
- `lib/blocks/styles.ts` — Theme variants
- `lib/blocks/template-store.ts` — DB persistence
- `components/editor/blocks/BlockEditor.tsx` — Main editor
- `components/editor/blocks/TemplateCreator.tsx` — Admin template builder
- `components/editor/renderers/PostRenderer.tsx` — Post renderer
- `components/editor/renderers/*Renderer.tsx` — Individual block renderers

### Portal System
- `app/portal/[portalSlug]/page.tsx` — Client wall (magic link auth)
- `app/admin/(dashboard)/portals/[id]/preview/page.tsx` — Admin preview
- `app/admin/(dashboard)/portals/[id]/edit/page.tsx` — Wall editor
- `app/admin/(dashboard)/content-library/page.tsx` — Content library admin
- `components/portal/PortalWall.tsx` — Pure wall renderer
- `components/portal/HeroBanner.tsx` — Hero with presets
- `components/portal/WallItemRenderer.tsx` — Item card renderer
- `components/admin/portals/HeroEditor.tsx` — Hero admin editor
- `components/admin/portals/AttachLibraryModal.tsx` — Attach flow
- `components/admin/portals/PortalItemsList.tsx` — Reorder + remove
- `lib/content-library/index.ts` — Content library repository
- `lib/portal-items/index.ts` — Portal items repository
- `lib/portal/index.ts` — Portal + magic links + sessions
- `lib/validation/portal.ts` — Zod schemas

### Theme System
- `components/theme/ThemeProvider.tsx` — CSS variables + RGB tokens
- `lib/theme/index.ts` — Colour utilities
- `tailwind.config.js` — Semantic colour tokens
- `app/admin/(dashboard)/settings/PalettePicker.tsx` — Curated palettes

### Content (Posts)
- `lib/content/index.ts` — Content CRUD + tag system
- `components/editor/TipTapEditor.tsx` — Rich text editor
- `components/editor/TagInput.tsx` — Tag input with auto-suggest
- `app/admin/(dashboard)/posts/` — Post management

### Scripts
- `scripts/setup-db.js` — Reproducible DB creation (schema + migrations + missing columns)
- `scripts/seed.ts` — Seed data (admin user, categories, tags, settings, templates)

---

## Database

**Important:** `schema.sql` is outdated and does not reflect all current columns. Use `scripts/setup-db.js` for fresh setup, which:
1. Applies `schema.sql` base
2. Applies migrations (`drizzle/migrations/`)
3. Adds missing columns that aren't in `schema.sql` yet

**Key tables:**
- `portals` — portal records with hero fields
- `content_library` — reusable content
- `portal_items` — unified wall pipeline (`source_type`: library | portal_specific | itinerary)
- `portal_members` — client emails + names
- `portal_magic_links` — magic link tokens
- `portal_sessions` — client sessions
- `itineraries` (Phase 6) — trip itineraries
- `itinerary_sections`, `itinerary_days`, `itinerary_segments`, `itinerary_stays` (Phase 6)
- `notepad_entries` (Phase 6) — admin scratchpad

---

## Known Issues

1. **better-sqlite3 crash in Codespace** — native module crashes after multiple server-action saves. Environment-specific. **Does not occur on local PC.** Workflow: edit in Codespace, test locally.

2. **Canvas system frozen** — 39 hardcoded emerald remain. To be deleted with Canvas system.

3. **`schema.sql` outdated** — missing newer columns (`opt_out_global_announcement`, `is_favourite`, `last_used_at`, `expires_at`, `is_expired`, `last_attempt_at`, hero fields). `scripts/setup-db.js` handles all known cases. Extend if new errors appear.

4. **Background colour fixed white** — Dark mode deferred indefinitely (reader preference, separate from branding).

---

## Development Workflow

**Editing:** Codespace (VS Code, Python heredocs, Copilot)
**Testing:** Local PC (no better-sqlite3 crash, real browser at localhost:3000)
**Sync:** `git push` from Codespace → `git pull` on local → test → report bugs

---

## Testing Commands

```bash
# Local first-time setup
node scripts/setup-db.js   # Create DB (schema + migrations + missing columns)
npm run seed               # Seed data

# Daily
npm run dev                # Dev server (port 3000)
npm run build              # Production build
npm start                  # Production server
```

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

---

## Future Work (Prioritised)

### Current Phase (6)
- Portal V2: Itinerary Builder + Admin Notepad
- Quick wins: hero presets 3→8, tile icons, notices removal, member names

### Post-V2 (Phase 7)
- Options segments (A/B alternatives)
- Cruise mode (port schedules)
- Overlapping stays
- Group splits
- People table (triggered)
- Client portal reply capability

### Production Hardening
- Delete Canvas system
- Fix better-sqlite3 crash on mini PC deployment
- Preview popup (modal → floating → fullscreen)
- Target surface token conversion
- Auto Save, Undo/Redo, Publish Validation, Error Boundaries

### Low Priority
- Dark mode (reader preference only)
- Template versioning
- Reading time / word count
- Additional block types (20+ threshold before registry refactor)

---

**Last Updated:** September 10, 2026