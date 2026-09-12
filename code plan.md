# MyCalTravels — CODE-PLAN.md (Revision 3)

## Overview

Block System (10 blocks) COMPLETE. Template Creator COMPLETE. Theme System COMPLETE. Portal V1 COMPLETE. Itinerary Builder V1 COMPLETE. Admin Notepad COMPLETE. Autosave Infrastructure COMPLETE (48 tests). Form Primitives COMPLETE. Canvas system FROZEN (pending deletion). Currently in Phase 7 bug-fix pass. Production build passes cleanly.

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS, Lucia Auth, TipTap, Vitest + Testing Library, react-moveable 0.56.0 (frozen Canvas only), DOMPurify

---

## Full Code Map

### Database Schema (`drizzle/schema/`)
```
activity-log.ts          # Audit trail
assets.ts                # Canvas assets
categories.ts            # Post categories
certifications.ts        # Myah's certifications
client-attachments.ts    # Client file attachments
client-merges.ts         # Client merge records
clients.ts               # Client inquiries
content-library.ts       # Reusable content
email-queue.ts           # Outbound email queue
email-suppressions.ts    # Email opt-outs
guide-tags.ts            # Guide-tag junction
guides.ts                # Destination guides (mode, isPinned)
index.ts                 # Schema exports
itineraries.ts           # Itineraries + sections + days + segments + stays
media.ts                 # Media library
notepad-entries.ts       # Admin-only notepad
pages.ts                 # Static pages
portal-checklist-states.ts # Portal checklist progress (legacy)
portal-documents.ts      # Portal documents (legacy)
portal-faqs.ts           # Portal FAQs (legacy)
portal-items.ts          # Unified wall pipeline
portal-magic-links.ts    # Magic link tokens
portal-members.ts        # Portal members
portal-notices.ts        # Portal notices (legacy)
portal-sessions.ts       # Portal sessions
portals.ts               # Client portals (hero fields)
post-tags.ts             # Post-tag junction
posts.ts                 # Blog posts
redirects.ts             # URL redirects
related-content.ts       # Related content links
review-tags.ts           # Review-tag junction
reviews.ts               # Product/hotel reviews
revisions.ts             # Content revision history
sessions.ts              # Lucia sessions
settings.ts              # Key-value settings
tags.ts                  # Post tags
templates.ts             # Canvas + block templates
users.ts                 # Admin user with TOTP
videos.ts                # YouTube videos
```

### Database Connection + Utilities (`lib/`)
```
db/
├── index.ts             # better-sqlite3 singleton
└── migrate.ts           # Database migration helper

auth/index.ts            # Lucia setup, TOTP, sessions, requireAuth, logActivity wrapper
security/index.ts        # Rate limiting, validation, sanitisation
content/index.ts         # CRUD for posts, guides, reviews, tags, categories
clients/index.ts         # Client inquiry management
media/index.ts           # Media upload/management
portal/index.ts          # Portal CRUD, magic links, sessions
portal-items/index.ts    # Unified wall pipeline (library + portal_specific + itinerary)
content-library/index.ts # Reusable content CRUD
itineraries/index.ts     # Itinerary repository (30+ functions)
notepad/index.ts         # Admin notepad repository + search
drafts/index.ts          # localStorage draft storage (durability layer)
settings/index.ts        # Site settings
email/
├── index.ts             # Resend integration, queue
└── templates.ts         # Email templates
search/index.ts          # FTS5 search
feed/index.ts            # Feed query (posts+guides+reviews)
logging/index.ts         # Activity logging
jobs/index.ts            # Scheduled tasks
monitoring/index.ts      # Health checks
theme/index.ts           # Colour validation, opacity, hexToRgb, darkenHex
validation/
├── portal.ts            # Zod schemas for library + portal items
└── itinerary.ts         # Zod schemas for itineraries
hooks/
├── useAutosaveField.ts  # Autosave hook (critical data-integrity code)
└── aggregateSaveState.ts # Multi-field save state aggregation
canvas/                  # FROZEN — Canvas system (see below)
```

### Block System (`components/editor/blocks/`)
```
BlockEditor.tsx          # Main vertical editor (10 blocks wired)
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
TemplatePreview.tsx      # Live preview (sticky on desktop)
TemplateCreator.tsx      # Admin template builder
```

### Block Renderers (`components/editor/renderers/`)
```
PostRenderer.tsx         # Switch on 10 block types
TitleRenderer.tsx
BodyRenderer.tsx
CalloutRenderer.tsx
HeroRenderer.tsx
ImageRenderer.tsx
GalleryRenderer.tsx
QuickFactsRenderer.tsx
QuoteRenderer.tsx
ProsConsRenderer.tsx
VerdictRenderer.tsx
CleanTipTapRenderer.tsx
```

### Portal System (`components/portal/`, `components/admin/`, `app/`)
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
│   ├── AddStayForm.tsx        # Inline new stay form
│   ├── StaysEditor.tsx        # Stay list + StayRow
│   ├── AddDayForm.tsx         # Inline new day form
│   ├── DaysEditor.tsx         # Day list + DayRow
│   ├── AddSegmentForm.tsx     # Inline new segment form (type selector)
│   └── SegmentsEditor.tsx     # Segment list + SegmentRow (collapsible)
└── notepad/
    ├── NotepadEntryForm.tsx   # Add note form
    └── (notepad page at app/admin/(dashboard)/portals/[id]/notepad/)
```

### Form Primitives (`components/ui/autosave/`)
```
AutosaveTextField.tsx    # Text input with autosave + SaveIndicator
AutosaveDateField.tsx    # Date input with min/max + quickSelect
AutosaveTimeField.tsx    # Time input with autosave
AutosaveSelectField.tsx  # Select with immediate flush
```

### Canvas Editor (`components/editor/canvas/` — FROZEN)
```
CanvasEditor.tsx         # Main canvas editor (Design mode)
CanvasRenderer.tsx       # Public canvas renderer (DOMPurify)
CanvasScaler.tsx         # Responsive scaling
MarqueeSelection.tsx     # Drag-select rectangle
ElementCatalog.tsx       # Element sidebar
PropertiesPanel.tsx      # Element styling panel
LayersPanel.tsx          # Layer management
TemplateManager.tsx      # Template picker/manager
SaveTemplateModal.tsx    # Save as template
PublishControls.tsx      # Draft/schedule/publish
ContextMenu.tsx          # Right-click menu
MiniCanvasEditor.tsx     # Basic preview (may be unused)
MiniCanvasEditorFull.tsx # Full editor for Story mode
ImageCropOverlay.tsx     # Image crop UI

elements/
├── TextElementView.tsx
├── TextFormatToolbar.tsx
├── ImageElementView.tsx
├── ShapeElementView.tsx
├── SmartBlockElementView.tsx
├── ButtonElementView.tsx
├── PdfElementView.tsx
├── PortalDatesElementView.tsx
├── PortalNoticesElementView.tsx
├── PortalDocumentsElementView.tsx
└── PortalFaqsElementView.tsx
```

### TipTap Editor (`components/editor/`)
```
TipTapEditor.tsx         # Rich text editor
TipTapRenderer.tsx       # Public TipTap renderer
Toolbar.tsx              # Formatting toolbar
CanvasBlockNode.tsx      # TipTap canvas node
CanvasBlockComponent.tsx # Canvas in TipTap
CanvasBlockRenderer.tsx  # Public canvas block renderer
InsertCanvasBlockButton.tsx
ModeSelectorModal.tsx    # Story vs Design chooser

blocks/
├── CalloutBox.tsx       # TipTap block extension
├── FileDownload.tsx
├── InstagramCard.tsx
└── YouTubeEmbed.tsx
```

### Feed System (`components/feed/`)
```
FeedCard.tsx             # Content card
FeedContainer.tsx        # Card list
FeedFilters.tsx          # Type/sort/category filters
FeedPage.tsx             # Feed page wrapper
InfiniteFeed.tsx         # Endless scroll
types.ts                 # FeedItem type
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
└── autosave/            # Form primitives (see above)

ErrorBoundary.tsx
admin/FeedAdminControls.tsx
canvas/PortalElementRenderer.tsx
```

### Homepage (`components/homepage/`)
```
CanvasHomepage.tsx       # Canvas-based homepage (current)
AboutBlurb.tsx           # Legacy
CallToAction.tsx         # Legacy
FeaturedContent.tsx      # Legacy
FeaturedVideo.tsx        # Legacy
HeroSection.tsx          # Legacy
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

(dashboard)/
├── layout.tsx           # Admin layout with nav
├── page.tsx             # Dashboard
├── content-library/
│   └── page.tsx         # Library admin UI
├── posts/               # Post list, new, edit
├── guides/              # Guide list, new, edit
├── reviews/             # Review list, new, edit
├── templates/           # Template Creator
├── settings/            # Site settings
│   ├── page.tsx
│   ├── PalettePicker.tsx
│   └── password/
├── media/               # Media library
├── clients/             # Client inquiries
├── portals/
│   ├── page.tsx         # Portal list
│   ├── new/page.tsx     # Create portal
│   ├── actions.ts       # Server actions
│   └── [id]/
│       ├── page.tsx                    # Portal detail
│       ├── edit/page.tsx               # Wall editor
│       ├── preview/page.tsx            # Admin wall preview
│       ├── itinerary/
│       │   ├── page.tsx                # Itinerary list
│       │   └── [itineraryId]/
│       │       ├── page.tsx            # Itinerary editor (17-line wrapper)
│       │       └── preview/page.tsx    # Admin itinerary preview
│       └── notepad/
│           └── page.tsx                # Admin notepad
├── homepage/            # Homepage canvas editor
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
├── blog/page.tsx
├── blog/[slug]/page.tsx
├── guides/page.tsx
├── guides/[slug]/page.tsx
├── reviews/page.tsx
├── reviews/[slug]/page.tsx
├── videos/page.tsx
├── faq/page.tsx
└── privacy/page.tsx

contact/
├── page.tsx             # Contact form
└── actions.ts           # Contact submission

search/page.tsx          # Search results
search/SearchContent.tsx # Search client component (Suspense-wrapped)

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
├── [id]/route.ts                # GET (full), PATCH (title), DELETE
├── [id]/sections/route.ts       # GET, POST
├── [id]/attach/route.ts         # POST (attach to portal wall)
└── (portal itinerary list/create via /api/portal/[id]/itineraries)

portal/[id]/itineraries/route.ts # GET (list), POST (create)

sections/
├── [id]/route.ts                # PATCH, DELETE
├── [id]/days/route.ts           # GET, POST
└── [id]/stays/route.ts          # GET, POST

days/
├── [id]/route.ts                # PATCH, DELETE
└── [id]/segments/route.ts       # GET, POST

segments/
└── [id]/route.ts                # PATCH, DELETE

stays/
└── [id]/route.ts                # PATCH, DELETE

notepad/
└── [id]/route.ts                # PATCH, DELETE

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
```

### Scripts
```
scripts/
├── seed.ts              # Seed admin user, categories, tags, settings, templates
└── setup-db.js          # Reproducible DB creation (schema.sql + migrations + missing columns)
```

### Tests
```
lib/hooks/
├── useAutosaveField.test.tsx           # 15 autosave tests (A1–A15)
└── useAutosaveField.durability.test.tsx # 14 durability tests (D1–D14)

lib/drafts/
└── index.test.ts                       # 19 storage-layer tests

tests/
└── integration.test.ts                 # Legacy integration test
```

### Migrations
```
drizzle/migrations/
├── 0001_fts5_triggers.sql
├── 0002_portal_content_library.sql   # Phase 5
├── 0003_itinerary.sql                # Phase 6.2 (incl. portal_items rebuild)
└── 0004_notepad.sql                  # Phase 6.3
```

### Config
```
vitest.config.ts         # Vitest config (jsdom, alias resolution)
vitest.setup.ts          # Test setup (jest-dom matchers, act warning filter)
tailwind.config.js       # Semantic colour tokens
next.config.mjs          # Next config (serverActions.allowedOrigins)
drizzle.config.ts        # Drizzle config
tsconfig.json            # TypeScript config
```

---

## Database Schema Details

### Core Tables
| Table | Purpose |
|-------|---------|
| `users` | Admin user (single: Myah) |
| `sessions` | Lucia auth sessions |
| `posts`, `guides`, `reviews` | Content (`mode`, `isPinned`, `isHighlighted`) |
| `templates` | Canvas + block templates (`content_type`) |
| `settings` | Key-value site settings |
| `tags`, `categories` | Post tag system |

### Portal Tables
| Table | Purpose |
|-------|---------|
| `portals` | Client portals (hero fields) |
| `content_library` | Reusable content |
| `portal_items` | Unified wall pipeline (`source_type`: `library` \| `portal_specific` \| `itinerary`) |
| `portal_members` | Client emails + names |
| `portal_magic_links`, `portal_sessions` | Client auth |
| `portal_notices`, `portal_documents`, `portal_faqs`, `portal_checklist_states` | Legacy (unused) |

### Itinerary Tables
| Table | Purpose |
|-------|---------|
| `itineraries` | Trip itineraries (soft delete) |
| `itinerary_sections` | Sections within itinerary |
| `itinerary_days` | Days within section |
| `itinerary_segments` | Activities/travel/meals/free days |
| `itinerary_stays` | Hotel stays (spans) |

### Notepad
| Table | Purpose |
|-------|---------|
| `notepad_entries` | Admin-only scratchpad per portal |

### Soft-Delete Pattern
- `itineraries` has `deleted_at`
- Child tables cascade hard-delete
- `portals` uses `isActive`, `archivedAt`, `deletedAt`

### Schema Notes
- `schema.sql` outdated; use `scripts/setup-db.js`
- Missing columns handled: `opt_out_global_announcement`, `is_favourite`, `last_used_at`, `expires_at`, `is_expired`, `last_attempt_at`, hero fields

---

## Autosave Hook Architecture

### `useAutosaveField<T>`
- Primitive-only (string | number | boolean | null)
- Single `saveInternal()` path — no direct `onSave` calls
- Multi-value in-flight dedup via `Map<T, number>`
- Version gating: stale responses ignored
- Mount gating: React state only; refs + localStorage always update
- Return shape: `{ value, setValue, saveState, dirty, flush, retry }`

### Durability Layer
- localStorage only, synchronous writes
- Namespaced keys: `myahtravels:draft:{entityType}:{entityId}:{fieldPath}`
- try/catch wrapped, never blocks editing
- Draft cleared only when: latest version AND `savedValue === currentValue`
- Exports: `writeDraft`, `readDraft`, `clearDraft`, `getFullDraftKey`, `getAllDraftKeys`, `findDraftsForEntity`, `clearDraftsForEntity`

### Form Primitives
- `AutosaveTextField` — text with autosave + indicator
- `AutosaveDateField` — date with min/max + quickSelect
- `AutosaveTimeField` — time with autosave
- `AutosaveSelectField` — select with immediate flush
- External value sync via refs (parent re-renders propagate safely)

---

## Known Issues

1. **better-sqlite3 crash in Codespace** — environment-specific; not on local PC. Workflow: edit Codespace, test local.
2. **Canvas system frozen** — 39 emerald remain. Delete when block editor approved.
3. **`schema.sql` outdated** — handled by `scripts/setup-db.js`.
4. **Native date/time pickers** — highlight-on-click issue requires `showPicker()` fallback (Bug 3, Phase 7).
5. **Segment edits revert on collapse** — SegmentRow unmounts fields; needs lifecycle fix (Bug 1, Phase 7).

---

## Remaining Work

### Phase 7.1 — Bug Fix Pass (Current)
- Batch 1: Segment edit revert, admin preview session, date picker `showPicker()`
- Batch 2: Date constraints, optional field audit
- Batch 3: Portal manager trash + recovery + preview
- Batch 4: Tile restyle, styled toast, Save button, custom pickers
- Batch 5: Segment UX refinement
- Batch 6: Download verification

### Phase 7.3 — Production Hardening
- Delete Canvas system
- Fix better-sqlite3 on deployment
- Undo/Redo, Publish Validation, Error Boundaries
- Preview popup (modal → floating → fullscreen)
- Target surface token conversion

### Phase 8 — Future / Deferred
- Itinerary V2: Options segments, cruise mode, overlapping stays, group splits
- People table (trigger-based upgrade)
- Global announcements (email all portal members)
- Client portal reply capability
- Template migration (Canvas → Block)
- Dark mode (reader preference only)

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
npm test                   # Run all vitest tests (48 passing)
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
```

**Note:** `.env` needs `RESEND_API_KEY=re_dummy_key_for_dev` for admin pages.

---

## Development Workflow

**Editing:** Codespace (VS Code, Python heredocs, Copilot)
**Testing:** Local PC (no better-sqlite3 crash, real browser at localhost:3000)
**Sync:** `git push` Codespace → `git pull` local → test → report bugs

---

**Last Updated:** September 12, 2026