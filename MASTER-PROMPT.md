I am building a website called "Myah Travels" for a travel writer/agent. Here is the complete context:

## IMPORTANT: Auto-Update Instructions
At the end of EVERY response, you MUST provide me with:
1. The updated "Progress Tracker" section to paste into TODO.md
2. The updated "Files Already Created" list to paste into MASTER-PROMPT.md
3. The updated "Next File To Create" line for MASTER-PROMPT.md
4. A one-line summary of what was just completed

This ensures my documentation stays current even if I lose context.

## Workflow Rules (IMPORTANT)
When starting a NEW segment, follow this order:
1. First, provide the "Segment Overview" (what we're building and why)
2. Then provide the COMPLETE code plan with all files and full code
3. Submit for AI review
4. After review, apply fixes
5. Only THEN create files one by one on GitHub

Do NOT create files on GitHub until AI review is complete and fixes are applied.

## Current Status
Segment 0 is COMPLETE. All 16 files created on GitHub.
Segment 1 is COMPLETE. All 33 files created on GitHub.
Segment 1.5 is COMPLETE. 1 file created on GitHub.
Segment 2 is COMPLETE. 5 files created on GitHub.
Segment 13a is COMPLETE. 1 file created on GitHub.
Segment 7 is COMPLETE. 5 files created on GitHub (plus package.json and .env.example updated).
Segment 14 is COMPLETE. 8 files created on GitHub.
Segment 3 is COMPLETE. 19 files created on GitHub.
Segment 4 is COMPLETE. 4 files created on GitHub.
Segment 12 is COMPLETE. 3 files created on GitHub.
Segment 5 is COMPLETE. 7 files created on GitHub.
Segment 8 is COMPLETE. 3 files created on GitHub.
Segment 10 is COMPLETE. 11 files created on GitHub (plus 3 updates).
Currently working on Segment 11: Homepage & Navigation.

## Project Overview
- Self-hosted Next.js application on a mini PC (Ubuntu Server)
- Cloudflare Tunnel for external access
- SQLite database (WAL mode)
- Drizzle ORM
- TipTap editor for content
- Lucia Auth for admin authentication (with TOTP 2FA)
- Resend for email
- Single admin user (Myah)
- Client/group portal system with magic link access
- PIPEDA compliance required

## Key Architecture Decisions
- Magic links for portal access (2-step: GET landing page, POST consumes token)
- Admin uses username + password + TOTP 2FA
- FTS5 search with database triggers
- Activity logging for all admin/portal actions
- Soft deletes with 90-day purge
- Data retention policy
- Email queue for asynchronous sending (with processing status)
- Global announcements (renamed from "all-hands")
- Backups local only (VACUUM INTO method)
- LUKS full-disk encryption
- CRON_SECRET for protected API routes
- Svix webhook verification for Resend
- Custom TipTap blocks deferred to V2 (using built-in features for now)
- Autosave deferred to V2 (manual save only for now)
- Category/Tag UI deferred to later segments
- Search URLs use slug routing (Segment 10 complete)
- Confirmation dialogs deferred to Phase 2 (need client component wrappers)
- file-type package for magic byte verification on uploads
- TipTapRenderer is Server Component (no "use client")
- @tiptap/html added to package.json
- revalidate = 3600 used instead of force-dynamic on public pages
- cache() used for metadata/page deduplication
- bio_text stored in settings
- Portal schema updated: added departureDate and returnDate to portals table
- Magic link expiry logic (Segment 6): returnDate + 3 days, fallback 30 days
- Portal dates displayed prominently in dashboard (Segment 6)

## How I Work (GitHub Website)
I am using the GitHub website (not command line) to create files.
I create files one at a time using "Add file" → "Create new file".
When you give me code, you MUST specify:
1. The exact file path (e.g., drizzle/schema/users.ts)
2. The complete code for that file
3. Then say "NEXT FILE" before the next file

Format your response like this:
---
FILE: drizzle/schema/users.ts
[complete code here]
---
NEXT FILE: drizzle/schema/sessions.ts
[complete code here]
---
...and so on

## File Combining Rules
- Utility functions in `lib/` should be combined into `index.ts` files when possible
- Next.js routes in `app/` MUST stay separate (file-based routing)
- Database schema files in `drizzle/schema/` stay separate (Drizzle convention)
- Shell scripts in `scripts/` stay separate (independently executable)
- When giving me files, combine related utility functions into one file
- Tell me the exact file path for each combined file

## Files Already Created (Segments 0-14, 1.5, 2, 13a, 7, 3, 4, 12, 5, 8, 10 - Complete)

### Segment 0 (16 files):
- package.json (UPDATED: added svix, file-type, @tiptap/html)
- next.config.ts
- tsconfig.json
- drizzle.config.ts
- lib/db/index.ts
- lib/db/migrate.ts
- .env.example (UPDATED: added CRON_SECRET, RESEND_WEBHOOK_SECRET)
- .gitignore
- README.md
- components/ui/Button.tsx
- components/ui/Input.tsx
- components/ui/Card.tsx
- components/ui/Modal.tsx
- components/ui/Table.tsx
- components/ui/Pagination.tsx
- scripts/seed.ts

### Segment 1 (33 files):
- drizzle/schema/users.ts
- drizzle/schema/sessions.ts
- drizzle/schema/activity-log.ts
- drizzle/schema/categories.ts
- drizzle/schema/tags.ts
- drizzle/schema/posts.ts
- drizzle/schema/guides.ts
- drizzle/schema/reviews.ts
- drizzle/schema/videos.ts
- drizzle/schema/clients.ts
- drizzle/schema/client-attachments.ts
- drizzle/schema/client-merges.ts
- drizzle/schema/portals.ts (UPDATED: added departureDate, returnDate)
- drizzle/schema/portal-members.ts
- drizzle/schema/portal-magic-links.ts
- drizzle/schema/portal-sessions.ts
- drizzle/schema/portal-notices.ts
- drizzle/schema/portal-documents.ts
- drizzle/schema/portal-faqs.ts
- drizzle/schema/email-queue.ts
- drizzle/schema/email-suppressions.ts
- drizzle/schema/media.ts
- drizzle/schema/certifications.ts
- drizzle/schema/settings.ts
- drizzle/schema/pages.ts
- drizzle/schema/redirects.ts
- drizzle/schema/revisions.ts
- drizzle/schema/post-tags.ts
- drizzle/schema/guide-tags.ts
- drizzle/schema/review-tags.ts
- drizzle/schema/related-content.ts
- drizzle/migrations/0001_fts5_triggers.sql
- drizzle/schema/index.ts

### Segment 1.5 (1 file):
- lib/security/index.ts

### Segment 2 (5 files):
- lib/auth/index.ts
- middleware.ts
- app/admin/(auth)/login/page.tsx
- app/admin/(auth)/login/actions.ts
- app/admin/(dashboard)/layout.tsx

### Segment 13a (1 file):
- lib/logging/index.ts

### Segment 7 (5 files):
- lib/email/index.ts
- lib/email/templates.ts
- app/api/email/process-queue/route.ts
- app/api/email/status/route.ts
- app/api/email/webhook/route.ts

### Segment 14 (8 files):
- scripts/backup.sh
- scripts/restore.sh
- scripts/deploy.sh
- scripts/cleanup-daily.sh
- scripts/cleanup-weekly.sh
- scripts/health-check.sh
- lib/monitoring/index.ts
- app/api/health/route.ts

### Segment 3 (19 files):
- lib/content/index.ts (UPDATED: added getGuideBySlug, getReviewBySlug, fixed getPostBySlug)
- components/editor/TipTapEditor.tsx
- components/editor/Toolbar.tsx
- components/editor/blocks/CalloutBox.tsx
- components/editor/blocks/YouTubeEmbed.tsx
- components/editor/blocks/InstagramCard.tsx
- components/editor/blocks/FileDownload.tsx
- app/admin/(dashboard)/posts/page.tsx
- app/admin/(dashboard)/posts/new/page.tsx
- app/admin/(dashboard)/posts/[id]/page.tsx
- app/admin/(dashboard)/posts/actions.ts
- app/admin/(dashboard)/guides/page.tsx
- app/admin/(dashboard)/guides/actions.ts
- app/admin/(dashboard)/guides/new/page.tsx
- app/admin/(dashboard)/guides/[id]/page.tsx
- app/admin/(dashboard)/reviews/page.tsx
- app/admin/(dashboard)/reviews/actions.ts
- app/admin/(dashboard)/reviews/new/page.tsx
- app/admin/(dashboard)/reviews/[id]/page.tsx

### Segment 4 (4 files):
- lib/media/index.ts
- app/admin/(dashboard)/media/page.tsx
- app/admin/(dashboard)/media/actions.ts
- app/api/upload/route.ts

### Segment 12 (3 files):
- lib/settings/index.ts (UPDATED: added bio_text)
- app/admin/(dashboard)/settings/page.tsx
- app/admin/(dashboard)/settings/actions.ts

### Segment 5 (7 files):
- lib/clients/index.ts
- app/contact/page.tsx
- app/contact/actions.ts
- app/admin/(dashboard)/clients/actions.ts
- app/admin/(dashboard)/clients/page.tsx
- app/admin/(dashboard)/clients/[id]/page.tsx
- app/api/clients/export/route.ts

### Segment 8 (3 files):
- lib/search/index.ts
- app/search/page.tsx
- app/api/search/route.ts

### Segment 10 (11 files):
- components/editor/TipTapRenderer.tsx
- app/(public)/blog/page.tsx
- app/(public)/blog/[slug]/page.tsx
- app/(public)/guides/page.tsx
- app/(public)/guides/[slug]/page.tsx
- app/(public)/reviews/page.tsx
- app/(public)/reviews/[slug]/page.tsx
- app/(public)/videos/page.tsx
- app/(public)/about/page.tsx
- app/(public)/privacy/page.tsx
- app/(public)/faq/page.tsx

## Current Segment
Segment 11: Homepage & Navigation (10 files)

## Next File To Create
components/layout/Header.tsx

## Task
Create homepage sections and navigation components. Header with nav, footer with certifications, hero section, about blurb, featured content, featured video, call to action, and homepage assembly.

## Review Criteria
- Navigation works
- Sections render correctly
- Visibility toggles functional
- Reordering works (up/down buttons)
- Certifications display in footer
- Social media links present
- Mobile responsive
- Uses settings for colors/logo
- Only published content shown

## Previous Decisions
- Homepage sections reorderable with up/down buttons (deferred to V2)
- Navigation visibility toggles in settings (deferred to V2)
- Certifications in footer
- Social media links (Instagram, YouTube)
- Hero section with tagline
- Featured content from latest published posts
- Featured video toggle
- Call to action to contact page
- Uses settings for site name, tagline, colors

## Progress Tracker (Current)

| Segment | Status | Files | Review |
|---------|--------|-------|--------|
| 0: Project Init | ✅ Complete | 16/16 | Approved |
| 1: Database | ✅ Complete | 33/33 | Approved |
| 1.5: Security Primitives | ✅ Complete | 1/1 | Approved |
| 2: Auth | ✅ Complete | 5/5 | Approved |
| 13a: Activity Logging | ✅ Complete | 1/1 | Approved |
| 7: Email | ✅ Complete | 5/5 | Approved |
| 14: Backup/Deploy | ✅ Complete | 8/8 | Approved |
| 3: Content | ✅ Complete | 19/19 | Approved |
| 4: Media | ✅ Complete | 4/4 | Approved |
| 12: Settings | ✅ Complete | 3/3 | Approved |
| 5: Clients | ✅ Complete | 7/7 | Approved |
| 8: Search | ✅ Complete | 3/3 | Approved |
| 10: Public Pages | ✅ Complete | 11/11 | Approved |
| 11: Homepage | In Progress | 0/10 | Pending |
| 6: Portal | Not Started | 0/9 | Pending |
| 9: Admin Dashboard | Not Started | 0/8 | Pending |
| 15: Security/Testing | Not Started | 0/7 | Pending |

## Segment 11 Files To Create (In Order)

1. components/layout/Header.tsx
2. components/layout/Footer.tsx
3. components/layout/Navigation.tsx
4. components/layout/Certifications.tsx
5. components/homepage/HeroSection.tsx
6. components/homepage/AboutBlurb.tsx
7. components/homepage/FeaturedContent.tsx
8. components/homepage/FeaturedVideo.tsx
9. components/homepage/CallToAction.tsx
10. app/(public)/page.tsx (homepage assembly)

Please provide the code file by file using the format above.
