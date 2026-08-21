I am building a website called "Myah Travels" for a travel writer/agent. Here is the complete context:

## IMPORTANT: Auto-Update Instructions
At the end of EVERY response, you MUST provide me with:
1. The updated "Progress Tracker" section to paste into TODO.md
2. The updated "Files Already Created" list to paste into MASTER-PROMPT.md
3. The updated "Next File To Create" line for MASTER-PROMPT.md
4. A one-line summary of what was just completed

This ensures my documentation stays current even if I lose context.

## Current Status
ALL 17 ORIGINAL SEGMENTS ARE CODE-COMPLETE. ~170 files created on GitHub.
Currently in TESTING phase using GitHub Codespaces.
Site loads with Tailwind styling working.
NOW STARTING: Canvas Design System (Phase 1 of 16).

## Testing Session Notes (Completed)
- Removed .check() from drizzle/schema/posts.ts, guides.ts, reviews.ts (Drizzle version doesn't support column-level .check)
- Renamed next.config.ts → next.config.mjs (Next.js 14 doesn't support .ts config)
- Created app/layout.tsx (root layout with html/body)
- Created app/globals.css (Tailwind directives)
- Created tailwind.config.js (content paths)
- Created postcss.config.js (tailwindcss + autoprefixer)
- Database created manually via better-sqlite3 exec (drizzle-kit push failed)
- All public pages load correctly
- Tailwind CSS renders correctly
- Contact form validates name + phone/email requirement

## Known Issues To Fix
1. Contact form: "dont call me" text accepted as phone number (needs phone format validation)
2. Admin login: untested
3. FTS5 search: untested
4. Email: untested (no Resend API key)
5. Media upload: untested
6. Portal magic links: untested end-to-end
7. Tailwind configs not yet pushed to GitHub

## Canvas Design System (NEW - 16 Phases)

Full plan in docs/CANVAS-PLAN.md

### Summary
- Hybrid editors: TipTap for blog posts, Canvas for reviews/guides/homepage/portals
- Canvas editor is Canva-like: drag, resize, rotate, snap, layers, templates
- Element types: text, image, shape, list, checklist, portal_checklist, proscons, button, pdf, divider, portal_dates, portal_notices, portal_documents, portal_faqs
- Libraries: react-moveable, react-selecto, nanoid, lodash.debounce, react-pdf
- Templates: unlimited save/overwrite/delete/duplicate per content type
- Autosave with debounce, draft system, schedule publishing
- Portal dynamic elements (dates, notices, docs, FAQs)
- Interactive portal checklists (session-gated, separate state table)

### Phase Status
- Phase 1 (types, schema, basic editor): NOT STARTED
- Phases 2-16: NOT STARTED

### Key Canvas Decisions
- editorType fixed at creation (tiptap for posts, canvas for reviews/guides/homepage/portals)
- No groupId (grouping cut for simplicity)
- No Spacer element
- Numbered lists = listType variant
- PDF uses react-pdf (not iframe)
- Assets table replaces raw file paths
- Element names auto-generated ("Text 1", "Image 2")
- Checklist items have stable IDs for portal state tracking

## Database Setup (Important)
drizzle-kit push fails with "This statement does not return data" error.
Workaround: Create tables manually using better-sqlite3 exec with raw SQL.
After tables exist, run `npm run seed`.
Full table creation SQL available in testing session notes.

## Project Overview
- Self-hosted Next.js application on a mini PC (Ubuntu Server)
- Cloudflare Tunnel for external access
- SQLite database (WAL mode)
- Drizzle ORM
- TipTap editor (blog posts) + Canvas editor (visual content)
- Lucia Auth for admin authentication (with TOTP 2FA)
- Resend for email
- Single admin user (Myah)
- Client/group portal system with magic link access
- PIPEDA compliance required

## Key Architecture Decisions
- Magic links for portal access (2-step: GET landing page, POST consumes token)
- Magic link expiry: returnDate + 3 days (fallback 30 days)
- Admin uses username + password + TOTP 2FA
- FTS5 search with database triggers
- Activity logging for all admin/portal actions
- Soft deletes with 90-day purge
- Data retention policy
- Email queue for asynchronous sending
- Global announcements
- Backups local only (VACUUM INTO)
- LUKS full-disk encryption
- CRON_SECRET for protected routes
- Svix webhook verification
- Search URLs use slug routing
- revalidate = 3600 on public pages
- cache() for deduplication
- Portal has departureDate + returnDate

## How I Work
- Using GitHub website to create files one at a time
- Each file gets exact path + complete code
- Files combined where possible (lib utilities in index.ts)
- Next.js routes stay separate (file-based routing)
- Database schema files stay separate
- Shell scripts stay separate
- Submit code for AI review BEFORE creating files on GitHub

## Files Grouped by Function

### Configuration
- package.json (svix, file-type, @tiptap/html)
- next.config.mjs (renamed from .ts)
- tsconfig.json
- drizzle.config.ts
- tailwind.config.js
- postcss.config.js
- .env.example
- .gitignore
- README.md

### Core App
- app/layout.tsx
- app/globals.css
- middleware.ts

### Database
- lib/db/index.ts
- lib/db/migrate.ts
- drizzle/schema/ (32 table files + index.ts)
- drizzle/migrations/0001_fts5_triggers.sql

### Authentication
- lib/auth/index.ts
- app/admin/(auth)/login/page.tsx
- app/admin/(auth)/login/actions.ts

### Security
- lib/security/index.ts

### Logging
- lib/logging/index.ts

### Email
- lib/email/index.ts
- lib/email/templates.ts
- app/api/email/process-queue/route.ts
- app/api/email/status/route.ts
- app/api/email/webhook/route.ts

### Content (Existing - TipTap for blog posts)
- lib/content/index.ts
- components/editor/TipTapEditor.tsx
- components/editor/Toolbar.tsx
- components/editor/TipTapRenderer.tsx
- components/editor/blocks/CalloutBox.tsx
- components/editor/blocks/YouTubeEmbed.tsx
- components/editor/blocks/InstagramCard.tsx
- components/editor/blocks/FileDownload.tsx
- app/admin/(dashboard)/posts/ (page, new, [id], actions)
- app/admin/(dashboard)/guides/ (page, new, [id], actions)
- app/admin/(dashboard)/reviews/ (page, new, [id], actions)

### Media
- lib/media/index.ts
- app/admin/(dashboard)/media/page.tsx
- app/admin/(dashboard)/media/actions.ts
- app/api/upload/route.ts

### Clients
- lib/clients/index.ts
- app/contact/page.tsx
- app/contact/actions.ts
- app/admin/(dashboard)/clients/ (page, [id], actions)
- app/api/clients/export/route.ts

### Portal
- lib/portal/index.ts
- app/admin/(dashboard)/portals/ (page, new, [id], actions)
- app/portal/access/[token]/page.tsx
- app/portal/consume/[token]/route.ts
- app/portal/[portalSlug]/page.tsx
- app/portal/logout/route.ts

### Search
- lib/search/index.ts
- app/search/page.tsx
- app/api/search/route.ts

### Settings
- lib/settings/index.ts
- app/admin/(dashboard)/settings/ (page, actions)

### Public Pages
- app/(public)/layout.tsx
- app/(public)/page.tsx
- app/(public)/blog/ (page, [slug])
- app/(public)/guides/ (page, [slug])
- app/(public)/reviews/ (page, [slug])
- app/(public)/videos/page.tsx
- app/(public)/about/page.tsx
- app/(public)/privacy/page.tsx
- app/(public)/faq/page.tsx

### Layout Components
- components/layout/Header.tsx
- components/layout/HeaderWrapper.tsx
- components/layout/Footer.tsx
- components/layout/Navigation.tsx
- components/layout/MobileMenu.tsx
- components/layout/Certifications.tsx

### Homepage Sections
- components/homepage/HeroSection.tsx
- components/homepage/AboutBlurb.tsx
- components/homepage/FeaturedContent.tsx
- components/homepage/FeaturedVideo.tsx
- components/homepage/CallToAction.tsx

### UI Components
- components/ui/Button.tsx
- components/ui/Input.tsx
- components/ui/Card.tsx
- components/ui/Modal.tsx
- components/ui/Table.tsx
- components/ui/Pagination.tsx

### Admin Dashboard
- app/admin/(dashboard)/layout.tsx
- app/admin/(dashboard)/page.tsx
- app/admin/(dashboard)/components/ (Sidebar, QuickActions, RecentPosts, ClientInquiries, ActivePortals, RecentActivity, StorageUsage)

### Automation & Monitoring
- lib/jobs/index.ts
- lib/monitoring/index.ts
- app/api/health/route.ts

### Scripts
- scripts/backup.sh
- scripts/restore.sh
- scripts/deploy.sh
- scripts/cleanup-daily.sh
- scripts/cleanup-weekly.sh
- scripts/health-check.sh
- scripts/seed.ts

### Tests
- tests/auth.test.ts
- tests/content.test.ts
- tests/portal.test.ts
- tests/clients.test.ts
- tests/search.test.ts
- tests/integration.test.ts

## Progress Tracker

| Segment | Status | Files | Review |
|---------|--------|-------|--------|
| 0: Project Init | ✅ Complete | 16/16 | Approved |
| 1: Database | ✅ Complete | 33/33 | Approved |
| 1.5: Security | ✅ Complete | 1/1 | Approved |
| 2: Auth | ✅ Complete | 5/5 | Approved |
| 13a: Logging | ✅ Complete | 1/1 | Approved |
| 7: Email | ✅ Complete | 5/5 | Approved |
| 14: Backup | ✅ Complete | 8/8 | Approved |
| 3: Content | ✅ Complete | 19/19 | Approved |
| 4: Media | ✅ Complete | 4/4 | Approved |
| 12: Settings | ✅ Complete | 3/3 | Approved |
| 5: Clients | ✅ Complete | 7/7 | Approved |
| 8: Search | ✅ Complete | 3/3 | Approved |
| 10: Public Pages | ✅ Complete | 11/11 | Approved |
| 11: Homepage | ✅ Complete | 13/13 | Approved |
| 6: Portal | ✅ Complete | 9/9 | Approved |
| 9: Dashboard | ✅ Complete | 8/8 | Approved |
| 15: Testing | ✅ Complete | 7/7 | Approved |
| Canvas Phase 1 | Not Started | 0/6 | Pending |
| Canvas Phases 2-16 | Not Started | 0/12 | Pending |

## Next Steps
1. Push Tailwind configs to GitHub
2. Fix contact form phone validation
3. Start Canvas Phase 1 (types + schema + basic editor)
4. Test admin login
5. Set up mini PC for deployment

## Testing Commands
npm run dev
npm run seed
npm run test
