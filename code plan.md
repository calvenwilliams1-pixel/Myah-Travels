You're right. Let me produce the complete CODE-PLAN with the full file map.

# MyCalTravels - CODE-PLAN.md (Revision 2 — Full)

## Overview

Block System (10 blocks) COMPLETE. Template Creator COMPLETE. Theme System COMPLETE. Portal V1 COMPLETE. Canvas system FROZEN (pending deletion). Phase 6 (Portal V2) in planning. Production build passes cleanly.

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS, Lucia Auth, TipTap, react-moveable 0.56.0, DOMPurify

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
content-library.ts       # Reusable content (Phase 5)
email-queue.ts           # Outbound email queue
email-suppressions.ts    # Email opt-outs
guide-tags.ts            # Guide-tag junction
guides.ts                # Destination guides (mode, isPinned)
index.ts                 # Schema exports
media.ts                 # Media library
pages.ts                 # Static pages
portal-checklist-states.ts # Portal checklist progress
portal-documents.ts      # Portal documents (legacy)
portal-faqs.ts           # Portal FAQs (legacy)
portal-items.ts          # Unified wall pipeline (Phase 5)
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
portal/index.ts          # Portal CRUD, magic links, sessions, notices (legacy)
portal-items/index.ts    # Unified wall pipeline (Phase 5)
content-library/index.ts # Reusable content CRUD (Phase 5)
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
└── portal.ts            # Zod schemas for library + portal items
canvas/
├── index.ts             # createElement, templates, parse (FROZEN)
├── parse.ts             # Pure parse (client-safe)
├── create-element.ts    # Pure createElement (client-safe)
└── clipboard.ts         # Cross-post copy/paste

# Phase 6 Planned
itineraries/index.ts     # (Planned) Itinerary repository
notepad/index.ts         # (Planned) Notepad repository
validation/
└── itinerary.ts         # (Planned) Itinerary Zod schemas
```

### Block System (Posts — `components/editor/blocks/`)
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
├── HeroBanner.tsx             # Image or preset fallback
└── WallItemRenderer.tsx       # Item card by type (pdf/image/text)

components/admin/
├── content-library/
│   └── AddContentModal.tsx    # Add PDF/Image/Text (auto-detect)
└── portals/
    ├── HeroEditor.tsx         # Hero settings + image upload
    ├── AttachLibraryModal.tsx # Attach library items
    ├── PortalSpecificItemModal.tsx # One-off content
    └── PortalItemsList.tsx    # Reorder + remove
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
└── Pagination.tsx

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
│       ├── page.tsx     # Portal detail
│       ├── edit/page.tsx # Wall editor
│       └── preview/page.tsx # Admin preview
├── homepage/            # Homepage canvas editor
└── components/          # Dashboard widgets
    ├── ActivePortals.tsx
    ├── ClientInquiries.tsx
    ├── QuickActions.tsx
    ├── RecentActivity.tsx
    ├── RecentPosts.tsx
    ├── Sidebar.tsx
    └── StorageUsage.tsx

# Phase 6 Planned
(dashboard)/portals/[id]/
├── itinerary/
│   ├── page.tsx               # (Planned) Itinerary list
│   └── [itineraryId]/page.tsx # (Planned) Itinerary editor
└── notepad/page.tsx           # (Planned) Admin notepad
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

portal/
├── [portalSlug]/page.tsx # Client wall (magic link auth)
├── access/[token]/page.tsx
├── consume/[token]/route.ts
└── logout/route.ts

layout.tsx               # Root layout

# Phase 6 Planned
portal/[slug]/itinerary/
└── [itineraryId]/page.tsx # (Planned) Client itinerary view
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
├── route.ts             # GET, POST (Phase 5)
└── [id]/route.ts        # DELETE (Phase 5)

portal/[id]/
├── route.ts             # GET (portal)
├── items/route.ts       # GET, POST (Phase 5)
├── items/[itemId]/route.ts # DELETE (Phase 5)
└── reorder/route.ts     # POST (Phase 5)

canvas/templates/
├── route.ts             # Template list/create (FROZEN)
└── [id]/route.ts        # Template get/update/delete

admin/
├── [type]/[id]/toggle/route.ts
└── theme/route.ts

clients/export/route.ts

email/
├── process-queue/route.ts
├── status/route.ts
└── webhook/route.ts

# Phase 6 Planned
itineraries/
├── route.ts
├── [id]/route.ts
├── [id]/sections/route.ts
├── [id]/attach/route.ts
└── ...

portal/[id]/notepad/
├── route.ts
└── [entryId]/route.ts
```

### Phase 6 Planned Components
```
components/admin/itinerary/
├── ItineraryList.tsx
├── ItineraryEditor.tsx
├── SectionEditor.tsx
├── StaysEditor.tsx
├── DayEditor.tsx
├── SegmentEditor.tsx
└── TravelSegmentFields.tsx

components/admin/notepad/
├── NotepadList.tsx
├── NotepadEntryForm.tsx
└── TagInput.tsx

components/portal/itinerary/
├── ItineraryView.tsx
├── SectionView.tsx
├── DayView.tsx
├── SegmentCard.tsx
├── TravelCard.tsx
└── StayBanner.tsx
```

### Scripts
```
scripts/
├── seed.ts              # Seed admin user, categories, tags, settings, templates
└── setup-db.js          # Reproducible DB creation (schema.sql + migrations + missing columns)
```

### Tests
```
tests/
└── integration.test.ts
```

### Migrations
```
drizzle/migrations/
├── 0001_fts5_triggers.sql
├── 0002_portal_content_library.sql   # Phase 5
├── 0003_itinerary.sql                # (Planned) Phase 6
└── 0004_notepad.sql                  # (Planned) Phase 6
```

---

## Database Schema Details

### Key Tables Overview
| Table | Purpose |
|-------|---------|
| `users` | Admin user (single: Myah) |
| `sessions` | Lucia auth sessions |
| `posts`, `guides`, `reviews` | Content (`mode`, `isPinned`, `isHighlighted`) |
| `templates` | Canvas + block templates (`content_type`) |
| `settings` | Key-value site settings |
| `tags`, `categories` | Post tag system |
| `portals` | Client portals (hero fields) |
| `content_library` | Reusable content |
| `portal_items` | Unified wall pipeline |
| `portal_members` | Client emails + names |
| `portal_magic_links`, `portal_sessions` | Client auth |
| `portal_notices`, `portal_documents`, `portal_faqs` | Legacy (unused) |

### Phase 6 Tables (Planned)
| Table | Purpose |
|-------|---------|
| `itineraries` | Trip itineraries |
| `itinerary_sections` | Sections within itinerary |
| `itinerary_days` | Days within section |
| `itinerary_segments` | Activities/travel/meals/etc |
| `itinerary_stays` | Hotel stays (spans) |
| `notepad_entries` | Admin scratchpad |

**Critical:** `portal_items.source_type` gains `'itinerary'` value; `portal_items.itinerary_id` references `itineraries(id)`.

### Schema Notes
- `schema.sql` outdated; use `scripts/setup-db.js`
- Missing columns handled: `opt_out_global_announcement`, `is_favourite`, `last_used_at`, `expires_at`, `is_expired`, `last_attempt_at`, hero fields
- Soft-delete pattern for `itineraries`; child tables use hard-delete cascade

---

## Known Issues

1. **better-sqlite3 crash in Codespace** — environment-specific; not on local PC. Workflow: edit Codespace, test local.

2. **Canvas system frozen** — 39 emerald remain. Delete when block editor approved.

3. **`schema.sql` outdated** — handled by `scripts/setup-db.js`.

4. **Missing DB columns on fresh setup** — extend `scripts/setup-db.js` if new errors appear.

---

## Remaining Work

### Phase 6.1 (Next)
- Hero presets 3 → 8
- Content tile icons
- Notices removal
- Portal member names

### Phase 6.2
- Itinerary Builder V1 (schema, backend, admin UI, client view, wall integration)

### Phase 6.3
- Admin Notepad (schema, backend, UI)

### Phase 7 (Future)
- Options segments, cruise mode, overlapping stays, group splits, People table

### Production Hardening
- Delete Canvas system
- Fix better-sqlite3 on deployment
- Preview popup
- Target surface tokens
- Auto Save, Undo/Redo, Publish Validation

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
```

**Note:** `.env` needs `RESEND_API_KEY=re_dummy_key_for_dev` for admin pages.

---

## Development Workflow

**Editing:** Codespace (VS Code, Python heredocs, Copilot)
**Testing:** Local PC (no better-sqlite3 crash, real browser at localhost:3000)
**Sync:** `git push` Codespace → `git pull` local → test → report bugs

---

**Last Updated:** September 10, 2026