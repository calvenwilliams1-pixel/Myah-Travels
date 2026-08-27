## File: Replace `code plan.md` on GitHub

**On GitHub (main branch):**
1. Go to `code plan.md`
2. Click pencil icon
3. Delete ALL content
4. Paste:

```markdown
# Myah Travels - CODE-PLAN.md

## Overview

All 17 original segments COMPLETE. Canvas Phases 1-15 COMPLETE. Phase 16 (Dual-Mode Editor) COMPLETE. Bug fixing in progress.

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS, Lucia Auth, TipTap, react-moveable 0.56.0, DOMPurify

---

## Moveable Fix - Merged

**Bug:** Moveable outline offset from elements.

**Root cause:** Moveable rendered OUTSIDE the canvas div. Control box needs to be inside the positioned container.

**Fix:** Move Moveable JSX inside the canvas container div.

**Files:**
- CanvasEditor.tsx ✅ Fixed
- MiniCanvasEditorFull.tsx ⏳ Fix ready, untested

---

## Full Code Map (Actual - From File System)

### Database Schema (drizzle/schema/)
```
activity-log.ts          # Audit trail
assets.ts                # Canvas assets
categories.ts            # Content categories
certifications.ts        # Myah's certifications
client-attachments.ts    # Client file attachments
client-merges.ts         # Client merge records
clients.ts               # Client inquiries
email-queue.ts           # Outbound email queue
email-suppressions.ts    # Email opt-outs
guide-tags.ts            # Guide-tag junction
guides.ts                # Destination guides (mode, isPinned)
index.ts                 # Schema exports
media.ts                 # Media library
pages.ts                 # Static pages
portal-checklist-states.ts # Portal checklist progress
portal-documents.ts      # Portal documents
portal-faqs.ts           # Portal FAQs
portal-magic-links.ts    # Magic link tokens
portal-members.ts        # Portal members
portal-notices.ts        # Portal notices
portal-sessions.ts       # Portal sessions
portals.ts               # Client portals
post-tags.ts             # Post-tag junction
posts.ts                 # Blog posts (mode, isPinned, isHighlighted)
redirects.ts             # URL redirects
related-content.ts       # Related content links
review-tags.ts           # Review-tag junction
reviews.ts               # Product/hotel reviews (mode, isPinned)
revisions.ts             # Content revision history
sessions.ts              # Lucia sessions
settings.ts              # Key-value settings
tags.ts                  # Tags
templates.ts             # Canvas templates (slug)
users.ts                 # Admin user with TOTP
videos.ts                # YouTube videos
```

### Database Connection + Utilities (lib/)
```
db/
├── index.ts             # better-sqlite3 singleton
└── migrate.ts           # Database migration helper

auth/index.ts            # Lucia setup, TOTP, sessions, requireAuth (⚠️ TEMP BYPASSED)
security/index.ts        # Rate limiting, validation, sanitisation
content/index.ts         # CRUD for posts, guides, reviews, tags, categories
clients/index.ts         # Client inquiry management
media/index.ts           # Media upload/management
portal/index.ts          # Portal magic links, sessions, notices
settings/index.ts        # Site settings
email/
├── index.ts             # Resend integration, queue
└── templates.ts         # Email templates
search/index.ts          # FTS5 search
feed/index.ts            # Feed query (posts+guides+reviews)
logging/index.ts         # Activity logging
jobs/index.ts            # Scheduled tasks
monitoring/index.ts      # Health checks
theme/index.ts           # Colour validation, opacity
canvas/
├── index.ts             # createElement, templates, parse
├── parse.ts             # Pure parse (client-safe)
├── create-element.ts    # Pure createElement (client-safe)
└── clipboard.ts         # Cross-post copy/paste (localStorage)
```

### Canvas Editor (components/editor/canvas/)
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
MiniCanvasEditor.tsx     # Basic preview (OLD - may be unused)
MiniCanvasEditorFull.tsx # Full editor for Story mode
ImageCropOverlay.tsx     # Image crop UI

elements/
├── TextElementView.tsx       # Rich text (TipTap)
├── TextFormatToolbar.tsx     # Text formatting
├── ImageElementView.tsx      # Image with crop
├── ShapeElementView.tsx      # Square/circle/diamond/triangle/line
├── SmartBlockElementView.tsx # List/checklist/proscons
├── ButtonElementView.tsx     # Button
├── PdfElementView.tsx        # PDF display
├── PortalDatesElementView.tsx
├── PortalNoticesElementView.tsx
├── PortalDocumentsElementView.tsx
└── PortalFaqsElementView.tsx
```

### TipTap Editor (components/editor/)
```
TipTapEditor.tsx         # Rich text editor
TipTapRenderer.tsx       # Public TipTap renderer
Toolbar.tsx              # Formatting toolbar
CanvasBlockNode.tsx      # TipTap canvas node
CanvasBlockComponent.tsx # Canvas in TipTap
CanvasBlockRenderer.tsx  # Public canvas block renderer
InsertCanvasBlockButton.tsx # Add canvas to TipTap
ModeSelectorModal.tsx    # Story vs Design chooser

blocks/
├── CalloutBox.tsx       # TipTap block extension
├── FileDownload.tsx     # TipTap block extension
├── InstagramCard.tsx    # TipTap block extension
└── YouTubeEmbed.tsx     # TipTap block extension
```

### Feed System (components/feed/)
```
FeedCard.tsx             # Content card
FeedContainer.tsx        # Card list
FeedFilters.tsx          # Type/sort/category filters
FeedPage.tsx             # Feed page wrapper
InfiniteFeed.tsx         # Endless scroll
types.ts                 # FeedItem type
```

### Theme (components/theme/ + lib/theme/)
```
components/theme/ThemeProvider.tsx  # Admin-controlled colours/background
lib/theme/index.ts                  # Colour validation, opacity clamping
```

### UI Components (components/)
```
ui/
├── Button.tsx
├── Input.tsx
├── Card.tsx
├── Table.tsx
├── ColorPicker.tsx
├── Modal.tsx
└── Pagination.tsx

ErrorBoundary.tsx        # React error boundary
admin/FeedAdminControls.tsx # Pin/highlight toggle buttons
canvas/PortalElementRenderer.tsx # Public portal element renderer
```

### Homepage (components/homepage/)
```
CanvasHomepage.tsx       # Canvas-based homepage (CURRENT)
AboutBlurb.tsx           # OLD - legacy
CallToAction.tsx         # OLD - legacy
FeaturedContent.tsx      # OLD - legacy
FeaturedVideo.tsx        # OLD - legacy
HeroSection.tsx          # OLD - legacy
```

### Layout (components/layout/)
```
Header.tsx
HeaderWrapper.tsx
Navigation.tsx
MobileMenu.tsx
Footer.tsx
Certifications.tsx
```

### Admin Pages (app/admin/)
```
(auth)/login/
├── page.tsx             # Login form
└── actions.ts           # loginAction, verifyTotpAction

(dashboard)/
├── layout.tsx           # Admin layout with nav
├── page.tsx             # Dashboard
├── posts/               # Post list, new, edit
├── guides/              # Guide list, new, edit
├── reviews/             # Review list, new, edit
├── settings/            # Site settings
│   └── password/        # Password change
├── media/               # Media library
├── clients/             # Client inquiries
├── portals/             # Portal management
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

### Public Pages (app/)
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
├── [portalSlug]/page.tsx
├── access/[token]/page.tsx
├── consume/[token]/route.ts
└── logout/route.ts

layout.tsx               # Root layout
```

### API Routes (app/api/)
```
auth/login/route.ts      # Login API (created in Codespace)
feed/route.ts            # Feed data
search/route.ts          # Search results
upload/route.ts          # Media upload
health/route.ts          # Health check

canvas/templates/
├── route.ts             # Template list/create
└── [id]/route.ts        # Template get/update/delete

admin/
├── [type]/[id]/toggle/route.ts # Pin/highlight toggle
└── theme/route.ts       # Theme settings

clients/export/route.ts  # Client CSV export

email/
├── process-queue/route.ts
├── status/route.ts
└── webhook/route.ts
```

---

## Remaining Work

### High Priority
1. MiniCanvasEditorFull outline fix (test)
2. SmartBlock inline editing
3. Button URL field
4. Template save freeze
5. Manage templates empty
6. Save draft unresponsive

### Medium Priority
7. Colour pickers
8. Portal properties
9. Divider styles
10. Image fill

---

## Testing Setup

- Codespaces for testing
- Auth bypassed (see MASTER-PROMPT)
- Database recreated via schema.sql + npm run seed
- .env has dummy Resend key
- Node 20 required (nvm use 20)
```

5. Commit: "Update CODE-PLAN with actual file map from filesystem"

---

**Tell me when done. Then docs are fully updated.**
