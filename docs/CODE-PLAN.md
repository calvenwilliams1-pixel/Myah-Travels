# MyCalTravels — CODE-PLAN.md (Revision 9)

## Overview

All planned phases COMPLETE: Block System, Template Creator, Theme, Portal V1, Itinerary Builder, Admin Notepad, Autosave Infrastructure (87 tests), Form Primitives, Phase 7.6 (Waves 1-4), Phase 7.8 Data Entry Automation, Phase 7.9 Post Editor, Phase 9 Client Memory, Phase 9.5 Polish + Security Audit. Current work is a large accumulated-testing pass — see `docs/TESTING.md`. Phase 8 deferred to post-launch. Canvas system frozen (unwired from nav and TipTap, pending deletion).

**Rendering note:** TipTap HTML rendering does NOT use `@tiptap/html`'s `generateHTML`. That function uses `zeed-dom` internally and silently drops inline styles on `textStyle` marks (Color, FontFamily, FontSize). See "Rendering Architecture" section.

**Content versioning:** `BodyData.tiptapJson` stores a versioned envelope. Legacy bare-doc rows still readable.

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3, WAL mode), Drizzle ORM, Tailwind CSS (+ @tailwindcss/typography), Lucia Auth, TipTap 2.27, Vitest + Testing Library (87 tests), react-moveable 0.56.0 (frozen Canvas only), DOMPurify, jsdom (server-side serializer).

---

## Full Code Map

### Repo Root

```
README.md                  # Project overview, setup, features
middleware.ts              # Next.js middleware (auth gates)
next.config.mjs            # Next config (serverActions.allowedOrigins)
next-env.d.ts              # Next.js type refs
tsconfig.json              # TypeScript config
tailwind.config.js         # Semantic colour tokens + typography plugin
postcss.config.js          # PostCSS config
drizzle.config.ts          # Drizzle config
vitest.config.ts           # Vitest config (jsdom, alias resolution, widened includes)
vitest.setup.ts            # Test setup (jest-dom, act warning filter)
package.json               # Scripts + dependencies
schema.sql                 # Legacy base schema (outdated — use scripts/setup-db.js)
.env.example               # Env var template
.gitignore                 # Standard ignores
```

### Docs (`docs/`)

```
ATTRIBUTION.md             # Static data sources (airports, airlines)
AUDIT.md                   # Earlier findings
CODE-PLAN.md               # This file — full file map
ITINERARY-STYLING-PLAN.md  # Phase 7.6.9 design notes
MASTER-PROMPT.md           # Context restoration (Revision 10)
PHASES-7.9-AND-9-PLAN.md   # Roadmap for post editor + client memory work
SRS.md                     # Software requirements specification (v5.0)
TESTING.md                 # Full testing checklist
TODO.md                    # Progress tracker
```

### Database Schema (`drizzle/schema/`)

```
activity-log.ts            # Audit trail
assets.ts                  # Canvas assets (frozen)
categories.ts              # Post categories
certifications.ts          # Myah's certifications
client-attachments.ts      # Client file attachments
client-merges.ts           # Client merge records
clients.ts                 # Client inquiries
color-presets.ts           # Colour presets (Phase 7.9)
content-library.ts         # Reusable content
email-queue.ts             # Outbound email queue
email-suppressions.ts      # Email opt-outs
guide-tags.ts              # Guide-tag junction
guides.ts                  # Destination guides
index.ts                   # Schema exports
itineraries.ts             # Itineraries + sections + days + segments + stays
media.ts                   # Media library
notepad-entries.ts         # Admin-only notepad
pages.ts                   # Static pages
people.ts                  # Client memory (Phase 9)
portal-checklist-states.ts # Legacy
portal-documents.ts        # Legacy
portal-faqs.ts             # Legacy
portal-items.ts            # Unified wall pipeline
portal-magic-links.ts      # Magic link tokens
portal-members.ts          # Portal members
portal-notices.ts          # Legacy
portal-sessions.ts         # Portal sessions
portals.ts                 # Client portals (hero fields)
post-tags.ts               # Post-tag junction
posts.ts                   # Blog posts
redirects.ts               # URL redirects
related-content.ts         # Related content links
review-tags.ts             # Review-tag junction
reviews.ts                 # Product/hotel reviews
revisions.ts               # Content revision history
sessions.ts                # Lucia sessions
settings.ts                # Key-value settings
suggestions.ts             # entities + field_values (Phase 7.8)
tags.ts                    # Post tags
templates.ts               # Canvas + block templates
users.ts                   # Admin user with TOTP
videos.ts                  # YouTube videos
```

### Database Connection + Utilities (`lib/`)

```
db/
├── index.ts               # better-sqlite3 singleton
└── migrate.ts             # Database migration helper

auth/index.ts              # Lucia setup, TOTP, sessions, requireAuth, logActivity wrapper
security/index.ts          # Rate limiting, validation, sanitisation
content/index.ts           # CRUD for posts, guides, reviews, tags, categories
clients/index.ts           # Client inquiry management
media/index.ts             # Media upload/management
portal/index.ts            # Portal CRUD, magic links, sessions
portal-items/index.ts      # Unified wall pipeline
content-library/index.ts   # Reusable content CRUD
itineraries/index.ts       # Itinerary repository (30+ functions)
notepad/index.ts           # Admin notepad repository + search
drafts/index.ts            # localStorage draft storage (durability layer)
settings/index.ts          # Site settings
email/
├── index.ts               # Resend integration, queue
└── templates.ts           # Email templates
search/index.ts            # FTS5 search
feed/index.ts              # Feed query (posts + guides + reviews)
logging/index.ts           # Activity logging
jobs/index.ts             # Scheduled tasks
monitoring/index.ts        # Health checks
theme/index.ts             # Colour validation, opacity, hexToRgb, darkenHex
validation/
├── portal.ts              # Zod schemas for library + portal items
└── itinerary.ts           # Zod schemas for itineraries
operations/record.ts       # Bulk-op undo-log-ready stub (Phase 7.8)
suggestions/
├── field-keys.ts          # Typed constant field-key registry
├── entities.ts            # Entity memory repository
├── field-values.ts        # Field value memory repository
├── statics.ts             # In-memory loaders for airports/airlines
└── record.ts              # Server-side suggestion recording
editor/
├── extensions.ts          # SHARED TipTap extension list (buildExtensions)
├── body-content.ts        # Versioned envelope (serialize/deserialize)
├── divider-extension.ts   # HorizontalRule with thickness + colour
├── font-size-extension.ts # Custom FontSize on textStyle
├── fonts.ts               # Curated font list
├── text-sizes.ts          # Size presets + fine-tune bounds
├── commands.ts            # Shared editor commands (toolbar + context menu)
├── color-presets.ts       # Colour preset CRUD
├── youtube.ts             # YouTube URL parsing
└── youtube-node.ts        # YouTube embed node
hooks/
├── useAutosaveField.ts    # Autosave hook (critical data integrity)
├── aggregateSaveState.ts  # Multi-field save state aggregation
├── useDocumentPiP.ts      # Picture-in-Picture API wrapper
└── useFocusRestore.ts     # Focus restoration on modal open/close/unmount
blocks/
├── index.ts               # Public exports
├── registry.ts            # BLOCK_REGISTRY
├── styles.ts              # Template style definitions
├── templates.ts           # STARTER_TEMPLATES
└── template-store.ts      # DB persistence for templates
canvas/                    # FROZEN — Canvas system (unwired, pending deletion)
```

### Block System (`components/editor/blocks/`)

```
BlockEditor.tsx            # Main vertical editor (10 blocks wired)
TitleBlockEditor.tsx
BodyBlockEditor.tsx
CalloutBlockEditor.tsx
HeroBlockEditor.tsx
ImageBlockEditor.tsx
GalleryBlockEditor.tsx
QuickFactsBlockEditor.tsx
QuoteBlockEditor.tsx
ProsConsBlockEditor.tsx
VerdictBlockEditor.tsx
TemplatePreview.tsx        # Live preview (used by PreviewPopout)
TemplateCreator.tsx        # Admin template builder
```

### Block Renderers (`components/editor/renderers/`)

```
PostRenderer.tsx           # Switch on 10 block types
TitleRenderer.tsx
BodyRenderer.tsx           # Deserializes body content then delegates
CalloutRenderer.tsx
HeroRenderer.tsx
ImageRenderer.tsx
GalleryRenderer.tsx
QuickFactsRenderer.tsx
QuoteRenderer.tsx
ProsConsRenderer.tsx
VerdictRenderer.tsx
CleanTipTapRenderer.tsx    # TipTap JSON → HTML (getSchema + DOMSerializer)
CleanTipTapRenderer.test.tsx # 26 render + sanitisation tests
```

### TipTap Editor (`components/editor/`)

```
TipTapEditor.tsx           # Rich text editor (uses buildExtensions)
TipTapRenderer.tsx         # [DELETED — merged into CleanTipTapRenderer]
Toolbar.tsx                # Formatting toolbar (gradient tiles)
EditorContextMenu.tsx      # Right-click menu with submenus (colour/size/font)
PreviewPopout.tsx          # Floating + fullscreen + Picture-in-Picture preview
TemplateCreator.tsx        # Admin template builder UI
ImageSourcePicker.tsx      # Upload OR paste URL OR library picker
ModeSelectorModal.tsx      # Story vs Design chooser
TagInput.tsx               # Tag entry widget

pickers/
├── ColorPicker.tsx        # Text/highlight colour with presets + custom
├── DividerConfig.tsx      # Divider thickness + colour popover
├── FontFamilyPicker.tsx   # Curated font list
├── FontSizePicker.tsx     # Size presets + fine-tune slider
└── WordCount.tsx          # Live word/character count
```

### Portal System

```
components/portal/
├── PortalWall.tsx             # Pure renderer (no auth)
├── HeroBanner.tsx             # Image or preset fallback (8 presets)
├── WallItemRenderer.tsx       # Item card by type (pdf/image/text/itinerary)
└── itinerary/
    └── ItineraryView.tsx      # Full itinerary view (client + admin preview)

components/admin/
├── SaveIndicator.tsx          # Small save status dot/text
├── content-library/
│   └── AddContentModal.tsx    # Add PDF/Image/Text (auto-detect)
├── portals/
│   ├── HeroEditor.tsx         # Hero settings + image upload
│   ├── AttachLibraryModal.tsx # Attach library items
│   ├── PortalSpecificItemModal.tsx # One-off content
│   └── PortalItemsList.tsx    # Reorder + remove
├── itinerary/
│   ├── ItineraryEditor.tsx    # Main editor shell
│   ├── AddSectionForm.tsx     # Inline new section form
│   ├── SectionEditor.tsx      # Section with stays + days
│   ├── AddStayForm.tsx
│   ├── StaysEditor.tsx
│   ├── AddDayForm.tsx
│   ├── DaysEditor.tsx
│   ├── AddSegmentForm.tsx
│   ├── SegmentsEditor.tsx     # Segment list + SegmentRow (collapsible)
│   ├── BulkAddForm.tsx        # Bulk-add textarea + preview table + draft
│   ├── CopySegmentModal.tsx   # Cross-itinerary segment picker
│   ├── SnippetPicker.tsx      # Insert / save instruction snippets
│   └── BookingParseForm.tsx   # Paste-booking parse + apply
├── suggestions/
│   └── stale-entities/page.tsx # Entity cleanup admin page
└── notepad/
    └── NotepadEntryForm.tsx   # Add note form
```

### Form Primitives (`components/ui/autosave/`)

```
AutosaveTextField.tsx      # Text input with autosave + SaveIndicator
AutosaveDateField.tsx      # Date input with min/max + quickSelect
AutosaveTimeField.tsx      # Time input with autosave
AutosaveSelectField.tsx    # Select with immediate flush
```

### Feed System (`components/feed/`)

```
FeedCard.tsx               # Content card
FeedContainer.tsx          # Card list
FeedFilters.tsx            # Type/sort/category filters
FeedPage.tsx               # Feed page wrapper
InfiniteFeed.tsx           # Endless scroll
types.ts                   # FeedItem type
```

### Theme System (`components/theme/`, `lib/theme/`)

```
components/theme/ThemeProvider.tsx  # CSS variables + RGB tokens
lib/theme/index.ts                  # Colour utilities
tailwind.config.js                  # Semantic colour tokens
```

### UI Components (`components/`)

```
ui/
├── Button.tsx
├── Input.tsx
├── Card.tsx
├── Table.tsx
├── ColorPicker.tsx
├── Modal.tsx
├── Pagination.tsx
├── AutocompleteField.tsx      # Autosave-backed autocomplete (editor-side)
├── AutocompleteInput.tsx      # Save-button-friendly autocomplete (add forms)
├── SuggestionDropdown.tsx     # Shared dropdown UI
└── autosave/                  # Form primitives (see above)

ErrorBoundary.tsx
admin/FeedAdminControls.tsx
canvas/PortalElementRenderer.tsx
```

### Homepage (`components/homepage/`)

```
CanvasHomepage.tsx         # Canvas-based homepage (frozen)
AboutBlurb.tsx             # Legacy
CallToAction.tsx           # Legacy
FeaturedContent.tsx        # Legacy
FeaturedVideo.tsx          # Legacy
HeroSection.tsx            # Legacy
```

### Layout (`components/layout/`)

```
Header.tsx
HeaderWrapper.tsx
Navigation.tsx
MobileMenu.tsx
Footer.tsx
Certifications.tsx
```

### Admin Pages (`app/admin/`)

```
(auth)/login/
├── page.tsx             # Login form
└── actions.ts           # loginAction, verifyTotpAction

(auth)/enroll-2fa/
├── page.tsx             # TOTP enrollment
└── EnrollTotpForm.tsx   # Enrollment form

(dashboard)/
├── layout.tsx           # Admin layout with nav
├── page.tsx             # Dashboard
├── content-library/page.tsx
├── posts/
│   ├── page.tsx         # List
│   ├── new/
│   │   ├── page.tsx
│   │   └── NewPostForm.tsx
│   ├── [id]/page.tsx    # Edit (uses TipTapEditor or CanvasEditor by mode)
│   └── actions.ts       # createPostAction, updatePostAction, deletePostAction
├── guides/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── reviews/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── templates/page.tsx   # Template Creator
├── settings/
│   ├── page.tsx
│   ├── PalettePicker.tsx
│   └── password/
├── media/page.tsx       # Media library
├── clients/
│   ├── page.tsx         # Inquiries + Clients tabs
│   └── people/[id]/page.tsx  # Person view
├── itineraries/page.tsx # Itinerary Library
├── portals/
│   ├── page.tsx         # Portal list
│   ├── new/page.tsx     # Create portal
│   ├── actions.ts       # Server actions
│   └── [id]/
│       ├── page.tsx              # Portal detail
│       ├── edit/page.tsx         # Wall editor
│       ├── preview/page.tsx      # Admin wall preview
│       ├── itinerary/
│       │   ├── page.tsx          # Itinerary list
│       │   └── [itineraryId]/
│       │       ├── page.tsx      # Itinerary editor (thin wrapper)
│       │       └── preview/page.tsx  # Admin itinerary preview
│       └── notepad/page.tsx      # Admin notepad
├── homepage/page.tsx    # Canvas homepage editor (frozen)
└── components/          # Dashboard widgets
    ├── ActivePortals.tsx
    ├── ClientInquiries.tsx
    ├── QuickActions.tsx
    ├── RecentActivity.tsx
    ├── RecentPosts.tsx
    ├── Sidebar.tsx
    └── StorageUsage.tsx
```

### Public Pages (`app/`)

```
(public)/
├── layout.tsx           # Public layout with header/footer
├── page.tsx             # Homepage = feed
├── about/page.tsx
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── guides/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── reviews/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── videos/page.tsx
├── faq/page.tsx
└── privacy/page.tsx

contact/
├── page.tsx             # Contact form
└── actions.ts           # Contact submission

search/
├── page.tsx             # Search results
└── SearchContent.tsx    # Client component (Suspense-wrapped)

portal/
├── [portalSlug]/
│   ├── page.tsx                    # Client wall (magic link auth)
│   └── itinerary/
│       └── [itineraryId]/page.tsx  # Client itinerary view
├── access/[token]/page.tsx
├── consume/[token]/route.ts
└── logout/route.ts

layout.tsx               # Root layout
```

### API Routes (`app/api/`)

```
auth/login/route.ts
feed/route.ts
search/route.ts
upload/route.ts
health/route.ts
tags/suggest/route.ts

content-library/
├── route.ts             # GET (list), POST (create)
└── [id]/route.ts        # DELETE

portal/[id]/
├── route.ts             # GET (portal with hero fields)
├── items/route.ts       # GET, POST (attach or portal-specific)
├── items/[itemId]/route.ts # DELETE
├── reorder/route.ts     # POST
└── notepad/route.ts     # GET (list + search), POST (create)

itineraries/
├── [id]/route.ts                # GET, PATCH, DELETE
├── [id]/sections/route.ts       # GET, POST
├── [id]/attach/route.ts         # POST (attach to wall)
└── [targetId]/copy-segment/route.ts # POST (cross-itinerary copy)

portal/[id]/itineraries/route.ts  # GET (list), POST (create)

sections/
├── [id]/route.ts                # PATCH, DELETE
├── [id]/days/route.ts           # GET, POST
├── [id]/stays/route.ts          # GET, POST
└── [id]/extend-day/route.ts     # POST

days/
├── [id]/route.ts                # PATCH, DELETE
├── [id]/segments/route.ts       # GET, POST
├── [id]/segments/bulk/route.ts  # POST (transactional bulk-add)
├── [id]/duplicate/route.ts      # POST
└── [id]/order/route.ts          # PATCH (reorder), DELETE (reset)

segments/
├── [id]/route.ts                # PATCH, DELETE
└── [id]/duplicate/route.ts      # POST

stays/[id]/route.ts              # PATCH, DELETE
notepad/[id]/route.ts            # PATCH, DELETE

suggestions/
├── entities/route.ts            # GET ?kind=&q=
├── entities/[id]/route.ts       # DELETE
├── entities/stale/route.ts      # GET
├── field-values/route.ts        # GET ?field=&q=
├── statics/route.ts             # GET ?field=&q=
├── snippets/route.ts            # GET, POST
├── snippets/[id]/route.ts       # PATCH, DELETE
└── telemetry/route.ts           # POST

color-presets/route.ts           # GET ?kind=, POST

portals/route.ts                 # GET (all portals for picker)

canvas/templates/                # FROZEN
├── route.ts
└── [id]/route.ts

admin/
├── [type]/[id]/toggle/route.ts
└── theme/route.ts

clients/export/route.ts

email/
├── process-queue/route.ts
├── status/route.ts
└── webhook/route.ts

people/
├── route.ts                     # GET, POST
└── [id]/route.ts                # GET, PATCH, DELETE
```

### Scripts (`scripts/`)

```
seed.ts                        # Seed admin, categories, tags, settings
setup-db.js                    # Reproducible DB creation (schema + migrations + seeds)
seed-templates.ts              # Seed 3 block templates (invoked by setup-db)
seed-color-presets.ts          # Seed colour presets (invoked by setup-db)
cleanup-canvas-templates.js    # One-off: delete legacy Canvas template rows
fetch-static-data.js           # Regenerate data/airports.json + data/airlines.json
migrate-travel-segments-to-legs.js # Backfill travel legs (Phase 7.6)
send-magic-links.ts            # CLI to send magic links for a portal

smoke/                         # Operational smoke scripts (not vitest tests)
├── auth.ts
├── clients.ts
├── content.ts
├── integration.ts
├── portal.ts
└── search.ts
```

### Tests

```
lib/hooks/
├── useAutosaveField.test.tsx           # 15 autosave tests (A1–A15)
└── useAutosaveField.durability.test.tsx # 14 durability tests (D1–D14)

lib/drafts/
└── index.test.ts                       # 19 storage-layer tests

lib/editor/
└── body-content.test.ts                # 13 versioning envelope tests

components/editor/renderers/
└── CleanTipTapRenderer.test.tsx        # 26 render + sanitisation tests

Total: 5 files, 87 tests passing.
```

### Migrations (`drizzle/migrations/`)

```
0001_fts5_triggers.sql
0002_portal_content_library.sql
0003_itinerary.sql
0004_notepad.sql
0005_reference_type.sql
0006_travel_legs.sql
0007_member_ban.sql
0008_itinerary_styling.sql
0009_data_entry_automation.sql
0010_day_order_mode.sql
0011_suggestion_events.sql
0012_field_values_fts.sql
0013_instruction_snippets.sql
0014_color_presets.sql
0015_people.sql
```

### Types (`types/`)

```
blocks.ts                  # BlockData, BlockType, Template, TemplateSection, TemplateStyle
feed.ts                    # Feed-related types
```

---

## Database Schema Details

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Admin user (single: Myah) with TOTP |
| `sessions` | Lucia auth sessions |
| `posts`, `guides`, `reviews` | Content (`mode`, `isPinned`, `isHighlighted`) |
| `templates` | Canvas + block templates (`content_type`) — **filter legacy Canvas rows on load** |
| `settings` | Key-value site settings |
| `tags`, `categories` | Post tag system |

### Portal Tables

| Table | Purpose |
|-------|---------|
| `portals` | Client portals (hero fields) |
| `content_library` | Reusable content |
| `portal_items` | Unified wall pipeline (`source_type`: `library` | `portal_specific` | `itinerary`) |
| `portal_members` | Client emails + names + ban status |
| `portal_magic_links`, `portal_sessions` | Client auth |
| `portal_notices`, `portal_documents`, `portal_faqs`, `portal_checklist_states` | Legacy (unused) |

### Itinerary Tables

| Table | Purpose |
|-------|---------|
| `itineraries` | Trip itineraries (soft delete) |
| `itinerary_sections` | Sections within itinerary |
| `itinerary_days` | Days within section (with `order_mode`) |
| `itinerary_segments` | Activities/travel/meals/free days |
| `itinerary_stays` | Hotel stays |
| `itinerary_travel_legs` | Multi-leg travel data |

### Suggestion Tables (Phase 7.8)

| Table | Purpose |
|-------|---------|
| `entities` | Entity memory (identity + defaults) |
| `field_values` | Field value memory (use_count, last_used_at) |
| `suggestion_events` | Telemetry (Phase 7.8 closeout) |
| `instruction_snippets` | Reusable segment instruction text |

### Client Memory (Phase 9)

| Table | Purpose |
|-------|---------|
| `people` | Canonical client records |
| `person_notes` | Per-person notes |
| `person_trip_history` | Cross-portal trip tracking |

### System

| Table | Purpose |
|-------|---------|
| `notepad_entries` | Admin-only scratchpad per portal |
| `activity_log` | Audit trail |
| `email_queue` | Outbound email queue |
| `email_suppressions` | Email opt-outs |
| `media` | Media library |
| `clients` | Client inquiries |
| `color_presets` | Editor colour presets (Phase 7.9) |
| `pages`, `redirects`, `related_content`, `revisions`, `videos`, `certifications` | Content support |
| `assets` | Canvas assets (frozen) |

### Soft-Delete Pattern

- `itineraries` has `deleted_at`; children cascade hard-delete
- `portals` uses `isActive`, `archivedAt`, `deletedAt`
- `posts`, `guides`, `reviews` have `deleted_at`

### Schema Notes

- `schema.sql` outdated; use `scripts/setup-db.js`
- `setup-db.js` handles: schema base, migrations, missing columns, seed colour presets, seed templates

---

## Rendering Architecture

### The Rule

**Never use `@tiptap/html`'s `generateHTML`.** It uses `zeed-dom` internally, a partial DOM implementation for edge runtimes that **silently drops inline styles** from `addGlobalAttributes` extensions (Color, FontFamily, custom FontSize) when multiple extensions contribute to the same `textStyle` mark. The symptom: raw JSON leaking into the DOM because `generateHTML` threw and the catch fell through.

### The Correct Path

All renderers use `getSchema` + `DOMSerializer` with a real `document`:

```ts
import { getSchema } from "@tiptap/core";
import { DOMSerializer, Node as PMNode } from "prosemirror-model";
import { buildExtensions } from "@/lib/editor/extensions";

const schema = getSchema(buildExtensions());
const serializer = DOMSerializer.fromSchema(schema);

const pmDoc = PMNode.fromJSON(schema, json);
const fragment = serializer.serializeFragment(pmDoc.content, { document });
const container = doc.createElement("div");
container.appendChild(fragment);
const html = container.innerHTML;
```

**Server:** jsdom-provided detached document. **Client:** real `document`.

See `components/editor/renderers/CleanTipTapRenderer.tsx` for the implementation.

### Shared Extension Module

`lib/editor/extensions.ts` exports `buildExtensions(opts)` — the single source of truth. Both `TipTapEditor` and all renderers consume it. **Do not maintain parallel extension lists.**

### Content Schema Versioning

`BodyData.tiptapJson` stores a versioned envelope via `lib/editor/body-content.ts`:

- Current: `{"version": 1, "content": <TipTap JSON>}`
- Legacy: bare TipTap JSON, still readable
- Writes go through `serializeBodyContent(json)` in `BodyBlockEditor.onChange`
- Reads go through `deserializeBodyContent(raw)` in `BodyRenderer`
- `getBodyContentVersion(raw)` — migration hook

### Picture-in-Picture Preview

`lib/hooks/useDocumentPiP.ts` wraps the browser PiP API. `PreviewPopout.tsx` renders `TemplatePreview` into the PiP window via React portal. Stylesheets and CSS vars are copied on open. Escape inside the PiP window closes it. Falls back cleanly on unsupported browsers.

---

## Autosave Hook Architecture

### `useAutosaveField<T>`

- Primitive-only values (string | number | boolean | null)
- Single `saveInternal()` path
- Multi-value in-flight dedup via `Map<T, number>`
- Version gating: stale responses ignored
- Mount gating: React state only; refs + localStorage always update
- Return shape: `{ value, setValue, saveState, dirty, flush, retry }`

### Durability Layer

- localStorage only, synchronous
- Namespaced keys: `myahtravels:draft:{entityType}:{entityId}:{fieldPath}`
- Draft cleared only when: latest version AND `savedValue === currentValue`
- Exports: `writeDraft`, `readDraft`, `clearDraft`, `getFullDraftKey`, `getAllDraftKeys`, `findDraftsForEntity`, `clearDraftsForEntity`

### Form Primitives

- `AutosaveTextField` — text with autosave
- `AutosaveDateField` — date with min/max + quickSelect
- `AutosaveTimeField` — time with autosave
- `AutosaveSelectField` — select with immediate flush

---

## Known Issues

1. **better-sqlite3 crash in Codespace** — Environment-specific; not on local PC (Node 22) or mini PC deploy. Workflow: edit Codespace, test local.

2. **Canvas system frozen** — Legacy `components/editor/canvas/` files remain. Unwired from nav and TipTap. Only reachable via `mode === "design"` branches, which no DB rows use. Safe to leave; delete when confirmed unnecessary.

3. **`schema.sql` outdated** — `scripts/setup-db.js` handles all known cases.

4. **Codespace Node version** — Codespace runs Node 24, local runs Node 22 LTS. Both work; local matches the deploy target.

---

## Phase Status

| Phase | Status | What |
|-------|--------|------|
| 1-6.4D | ✅ Complete | Foundation through Autosave Infrastructure |
| 7 | ✅ Complete | All 6 bug-fix batches |
| 7.5 | Partial | Singapore Demo seeded; Japan+Cruise+Singapore pending |
| 7.6 | ✅ Complete | Waves 1-4 (incl. itinerary styling) |
| 7.8 | ✅ Complete | Data Entry Automation |
| 7.9 | ✅ Complete | Post Editor and Writing Tools |
| 9 | ✅ Complete | Client Memory System |
| 9.5 | ✅ Complete | Polish Pass + Security Audit |
| **Testing pass** | **🔄 Current** | **Browser verification of everything since 7.6 Wave 2** |
| 7.3 | ⏳ Pending | Publish validation, error boundaries, responsive preview |
| 8 | ⏳ Future | Options segments, cruise mode, People table V2 |

---

## Testing Setup

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

**Note:** `.env` needs `RESEND_API_KEY=re_dummy_key_for_dev` (dummy OK in dev) for admin pages.

---

## Development Workflow

- **Editing:** Codespace (VS Code, Python heredocs, Copilot)
- **Testing:** Local PC (Node 22, no better-sqlite3 crash, real browser)
- **Sync:** `git push` Codespace → `git pull` local → test → report bugs

---

**Last Updated:** September 18, 2026
