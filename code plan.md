# Code Planning Phase - Segmentation Strategy

## Overview

We'll break the project into logical segments that can be developed independently, reviewed by AI at each stage, and merged later. Each segment will have its own code plan, review cycle, and GitHub branch.

---

## Proposed Development Segments

| Segment | Name | Dependencies | Priority | Est. Complexity |
|---------|------|--------------|----------|-----------------|
| 1 | Database Schema & Migrations | None | Critical | Medium |
| 2 | Authentication (Admin) | Segment 1 | Critical | High |
| 3 | Content Management (Blog/Guides/Reviews) | Segments 1, 2 | Critical | High |
| 4 | Media Library | Segments 1, 2 | High | Medium |
| 5 | Client Inquiry System | Segments 1, 2 | High | Medium |
| 6 | Portal System (Magic Links) | Segments 1, 2 | High | High |
| 7 | Email System (Queue + Resend) | Segments 1 | High | Medium |
| 8 | Search (FTS5) | Segments 1, 3 | Medium | Low |
| 9 | Admin Dashboard UI | Segments 2, 3, 4, 5, 6 | High | High |
| 10 | Public Pages (Blog/Guides/Reviews) | Segments 1, 3 | High | Medium |
| 11 | Homepage & Navigation | Segments 1, 3, 10 | Medium | Medium |
| 12 | Settings & Customization | Segments 1, 2 | Medium | Medium |
| 13 | Activity Logging | Segments 1, 2 | Medium | Medium |
| 14 | Backup Scripts & Deployment | Segments 1 | Medium | Low |
| 15 | Security Hardening & Testing | All | Critical | High |

---

## Recommended Build Order

```
Phase 1: Foundation
├── Segment 1: Database Schema & Migrations
├── Segment 7: Email System
├── Segment 14: Backup & Deployment Scripts
└── Segment 13: Activity Logging

Phase 2: Core Features
├── Segment 2: Authentication
├── Segment 3: Content Management
├── Segment 4: Media Library
└── Segment 12: Settings & Customization

Phase 3: Business Features
├── Segment 5: Client Inquiry System
├── Segment 8: Search
└── Segment 10: Public Pages

Phase 4: Portal System
├── Segment 6: Portal System (Magic Links)
└── Segment 11: Homepage & Navigation

Phase 5: Integration & Polish
├── Segment 9: Admin Dashboard UI
└── Segment 15: Security Hardening & Testing
```

---

## Detailed Segment Breakdown

### Segment 1: Database Schema & Migrations

**Files to create:**
```
/drizzle/
├── schema/
│   ├── users.ts
│   ├── sessions.ts
│   ├── activity-log.ts
│   ├── categories.ts
│   ├── tags.ts
│   ├── posts.ts
│   ├── guides.ts
│   ├── reviews.ts
│   ├── videos.ts
│   ├── clients.ts
│   ├── portals.ts
│   ├── email.ts
│   ├── media.ts
│   ├── settings.ts
│   ├── pages.ts
│   ├── redirects.ts
│   └── revisions.ts
├── migrations/
│   └── (auto-generated)
└── index.ts
```

**What it includes:**
- All table definitions from SRS Section 4
- FTS5 virtual table + triggers
- All indexes
- PRAGMA settings
- Migration setup

**Review criteria:**
- Schema matches SRS exactly
- All constraints present
- Triggers correct
- Indexes appropriate

---

### Segment 2: Authentication (Admin)

**Files to create:**
```
/lib/
├── auth/
│   ├── lucia.ts
│   ├── session.ts
│   ├── totp.ts
│   └── password.ts
├── middleware.ts
/app/
├── admin/
│   ├── login/
│   │   └── page.tsx
│   ├── login/
│   │   └── actions.ts
│   └── layout.tsx (protected)
```

**What it includes:**
- Lucia Auth setup
- Login page with username/password
- TOTP setup (QR code, verification)
- TOTP verification on login
- Backup codes
- Session management
- Logout
- Rate limiting on login attempts
- Activity log integration

**Review criteria:**
- Security best practices
- 2FA flow correct
- Session handling secure
- Rate limiting functional

---

### Segment 3: Content Management (Blog/Guides/Reviews)

**Files to create:**
```
/lib/
├── content/
│   ├── posts.ts
│   ├── guides.ts
│   ├── reviews.ts
│   ├── tags.ts
│   └── categories.ts
/app/
├── admin/
│   ├── posts/
│   │   ├── page.tsx (list)
│   │   ├── new/
│   │   │   └── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx (edit)
│   │   └── actions.ts
│   ├── guides/
│   │   └── (similar structure)
│   └── reviews/
│       └── (similar structure)
/components/
├── editor/
│   ├── TipTapEditor.tsx
│   ├── Toolbar.tsx
│   ├── blocks/
│   │   ├── CalloutBox.tsx
│   │   ├── YouTubeEmbed.tsx
│   │   ├── InstagramCard.tsx
│   │   └── FileDownload.tsx
│   └── extractText.ts (for FTS5)
```

**What it includes:**
- CRUD operations for posts, guides, reviews
- TipTap editor with custom blocks
- Autosave
- Draft/schedule/publish workflow
- Slug generation
- Revision history
- Soft delete
- Related content linking
- FTS5 text extraction

**Review criteria:**
- Editor functionality
- Autosave reliability
- Slug/redirect handling
- Revision tracking
- Soft delete working

---

### Segment 4: Media Library

**Files to create:**
```
/lib/
├── media/
│   ├── upload.ts
│   ├── optimize.ts
│   └── folders.ts
/app/
├── admin/
│   └── media/
│       ├── page.tsx
│       └── actions.ts
/app/
├── api/
│   └── upload/
│       └── route.ts
```

**What it includes:**
- File upload endpoint
- Sharp image optimization
- WebP conversion
- Folder management
- Alt text/captions
- Usage tracking (block deletion if used)
- Storage usage indicator

**Review criteria:**
- Upload works reliably
- Optimization effective
- Usage tracking prevents broken images
- Folders functional

---

### Segment 5: Client Inquiry System

**Files to create:**
```
/lib/
├── clients/
│   ├── inquiries.ts
│   ├── merge.ts
│   └── anonymize.ts
/app/
├── admin/
│   └── clients/
│       ├── page.tsx (list)
│       ├── [id]/
│       │   └── page.tsx (detail)
│       └── actions.ts
/app/
├── contact/
│   ├── page.tsx (public form)
│   └── actions.ts
/app/
├── api/
│   └── inquiries/
│       └── route.ts
```

**What it includes:**
- Public inquiry form
- Form validation
- Spam protection (Turnstile + honeypot)
- Consent logging
- Duplicate detection
- Client database (view, search, filter, sort)
- Internal notes
- File attachments
- Merge clients
- Anonymize (PIPEDA)
- Export CSV
- Email notification to admin

**Review criteria:**
- Form validation correct
- Spam protection works
- Consent logged properly
- Duplicate detection functional
- Merge safe
- Anonymize works

---

### Segment 6: Portal System (Magic Links)

**Files to create:**
```
/lib/
├── portal/
│   ├── magic-link.ts
│   ├── sessions.ts
│   ├── notices.ts
│   ├── documents.ts
│   └── faqs.ts
/app/
├── admin/
│   └── portals/
│       ├── page.tsx (list)
│       ├── new/
│       │   └── page.tsx
│       ├── [id]/
│       │   └── page.tsx (manage)
│       └── actions.ts
/app/
├── portal/
│   ├── access/
│   │   └── [token]/
│   │       └── page.tsx (landing)
│   ├── consume/
│   │   └── [token]/
│   │       └── route.ts (POST)
│   └── [portalSlug]/
│       └── page.tsx (dashboard)
```

**What it includes:**
- Portal CRUD
- Member management
- Magic link generation + sending
- Two-step magic link flow
- Token revocation
- Portal dashboard (client view)
- Notices (pinned, global announcements)
- Documents
- FAQs
- Access logging
- Email queue integration

**Review criteria:**
- Magic link flow correct (2-step)
- Token revocation works
- Portal isolation enforced
- Notices/documents/FAQs functional
- Email notifications queued
- Access logged

---

### Segment 7: Email System

**Files to create:**
```
/lib/
├── email/
│   ├── resend.ts
│   ├── queue.ts
│   └── templates/
│       ├── magic-link.ts
│       ├── inquiry-notification.ts
│       ├── portal-notice.ts
│       └── global-announcement.ts
/app/
├── api/
│   └── email/
│       ├── process-queue/
│       │   └── route.ts
│       └── status/
│           └── route.ts
```

**What it includes:**
- Resend API integration
- Email queue table operations
- Template system
- Queue processor (background)
- Retry logic
- Suppression list check

**Review criteria:**
- Queue works asynchronously
- Templates render correctly
- Retry logic functional
- Suppression respected

---

### Segment 8: Search (FTS5)

**Files to create:**
```
/lib/
├── search/
│   ├── index.ts
│   ├── extract.ts
│   └── query.ts
/app/
├── api/
│   └── search/
│       └── route.ts
/app/
├── search/
│   └── page.tsx (results)
```

**What it includes:**
- FTS5 query functions
- TipTap JSON text extraction
- Search API endpoint
- Search results page
- Filter by content type

**Review criteria:**
- Search returns relevant results
- Text extraction clean
- Filters work

---

### Segment 9: Admin Dashboard UI

**Files to create:**
```
/app/
├── admin/
│   ├── page.tsx (dashboard)
│   ├── layout.tsx
│   └── components/
│       ├── Sidebar.tsx
│       ├── QuickActions.tsx
│       ├── RecentPosts.tsx
│       ├── ClientInquiries.tsx
│       ├── ActivePortals.tsx
│       ├── RecentActivity.tsx
│       └── StorageUsage.tsx
```

**What it includes:**
- Main dashboard layout
- Sidebar navigation
- Quick action buttons
- Recent posts widget
- Client inquiries widget
- Active portals widget
- Recent activity widget
- Storage usage indicator
- Mobile-responsive design

**Review criteria:**
- Dashboard informative
- Navigation intuitive
- Mobile-friendly
- Widgets functional

---

### Segment 10: Public Pages

**Files to create:**
```
/app/
├── (public)/
│   ├── page.tsx (homepage)
│   ├── blog/
│   │   ├── page.tsx (listing)
│   │   └── [slug]/
│   │       └── page.tsx (detail)
│   ├── guides/
│   │   ├── page.tsx (listing)
│   │   └── [slug]/
│   │       └── page.tsx (detail)
│   ├── reviews/
│   │   ├── page.tsx (listing)
│   │   └── [slug]/
│   │       └── page.tsx (detail)
│   ├── videos/
│   │   └── page.tsx
│   ├── about/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── privacy/
│   │   └── page.tsx
│   └── faq/
│       └── page.tsx
```

**What it includes:**
- Blog listing + detail
- Guide listing + detail
- Review listing + detail
- Video hub
- About page
- Contact page (with inquiry form)
- Privacy policy page
- FAQ page
- SEO meta tags
- Structured data
- Social sharing

**Review criteria:**
- Pages render correctly
- SEO tags present
- Structured data correct
- Responsive design

---

### Segment 11: Homepage & Navigation

**Files to create:**
```
/components/
├── layout/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Navigation.tsx
│   └── Certifications.tsx
/components/
├── homepage/
│   ├── HeroSection.tsx
│   ├── AboutBlurb.tsx
│   ├── FeaturedContent.tsx
│   ├── FeaturedVideo.tsx
│   ├── Testimonials.tsx
│   └── CallToAction.tsx
```

**What it includes:**
- Header with navigation
- Footer with certifications
- Homepage sections
- Section visibility toggles
- Up/down reordering
- Certification display
- Social media links

**Review criteria:**
- Navigation works
- Sections render
- Toggles functional
- Reordering works
- Certifications display

---

### Segment 12: Settings & Customization

**Files to create:**
```
/app/
├── admin/
│   └── settings/
│       ├── page.tsx
│       └── actions.ts
/lib/
├── settings/
│   ├── site.ts
│   ├── navigation.ts
│   ├── homepage.ts
│   ├── colors.ts
│   └── fonts.ts
```

**What it includes:**
- Site settings (name, tagline, logo)
- Color picker
- Font selection (5 options)
- Navigation visibility toggles
- Homepage section order
- Footer text
- Certification management
- Contact settings

**Review criteria:**
- Settings save correctly
- Colors apply site-wide
- Fonts apply
- Toggles work
- Certifications upload

---

### Segment 13: Activity Logging

**Files to create:**
```
/lib/
├── logging/
│   ├── activity.ts
│   ├── middleware.ts
│   └── cleanup.ts
/app/
├── admin/
│   └── activity/
│       ├── page.tsx
│       └── actions.ts
```

**What it includes:**
- Activity log utility
- Auto-logging middleware
- Admin log viewer
- Filter/sort/search
- Cleanup cron job
- Export log

**Review criteria:**
- All actions logged
- Log viewer functional
- Filters work
- Cleanup scheduled

---

### Segment 14: Backup & Deployment Scripts

**Files to create:**
```
/scripts/
├── deploy.sh
├── backup.sh
├── restore.sh
├── cleanup-daily.sh
├── cleanup-weekly.sh
└── health-check.sh
```

**What it includes:**
- Deployment script
- Backup script (VACUUM INTO)
- Restore script
- Cleanup scripts (retention policy)
- Health check
- Systemd service files

**Review criteria:**
- Scripts executable
- Backup uses safe method
- Restore documented
- Cleanup matches retention policy

---

### Segment 15: Security Hardening & Testing

**Files to create:**
```
/lib/
├── security/
│   ├── rate-limit.ts
│   ├── validation.ts
│   ├── headers.ts
│   └── csrf.ts
/tests/
├── auth.test.ts
├── content.test.ts
├── portal.test.ts
├── clients.test.ts
└── search.test.ts
```

**What it includes:**
- Rate limiting middleware
- Input validation utilities
- Security headers
- CSRF protection
- Unit tests
- Integration tests
- Penetration testing checklist

**Review criteria:**
- Rate limiting works
- Validation comprehensive
- Headers correct
- Tests pass
- No known vulnerabilities

---

## GitHub Repository Structure

```
myah-travels/
├── .github/
│   └── workflows/ (CI if desired)
├── app/
│   ├── (public)/
│   ├── admin/
│   ├── portal/
│   └── api/
├── components/
├── lib/
├── public/
│   └── uploads/
├── scripts/
├── content/
├── drizzle/
├── tests/
├── .env.example
├── package.json
├── README.md
└── DEPLOYMENT.md
```

## Branch Strategy

```
main (production)
├── feature/database-schema
├── feature/auth
├── feature/content-management
├── feature/media-library
├── feature/client-inquiry
├── feature/portal-system
├── feature/email-system
├── feature/search
├── feature/admin-dashboard
├── feature/public-pages
├── feature/homepage
├── feature/settings
├── feature/activity-logging
├── feature/backup-scripts
└── feature/security
```

Each branch worked independently, reviewed, then merged to main.

---

## Master Context Prompt (For New Conversations)

Save this prompt to use when starting a new conversation with any AI:

```
I am building a website called "Myah Travels" for a travel writer/agent. Here is the complete context:

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
- Data retention policy (see SRS Section 13)
- Email queue for asynchronous sending
- Global announcements (renamed from "all-hands")
- Backups local only (VACUUM INTO method)
- LUKS full-disk encryption

## Current Segment
[Describe which segment you're working on, e.g., "Segment 3: Content Management"]

## SRS Reference
The complete SRS is available. Key sections:
- Section 4: Database Schema
- Section 5: Functional Requirements
- Section 6: Admin Interface Specs
- Section 7: Portal Specs
- Section 8: Security Requirements
- Section 13: Data Retention Policy

## Task
[Describe what code needs to be written for this segment]

## Review Criteria
[List the review criteria for this segment]

## Previous Decisions
[Any decisions made in previous segments that affect this one]

Please write the code plan for this segment. Include:
1. File structure
2. Component breakdown
3. API endpoints
4. Database interactions
5. Edge cases
6. Testing approach

Write the plan first, then I'll request code implementation after review.
```

---

## Todo List

- [ ] **Segment 1:** Database Schema & Migrations
- [ ] **Segment 7:** Email System
- [ ] **Segment 14:** Backup & Deployment Scripts
- [ ] **Segment 13:** Activity Logging
- [ ] **Segment 2:** Authentication (Lucia + TOTP)
- [ ] **Segment 3:** Content Management (TipTap + CRUD)
- [ ] **Segment 4:** Media Library (Sharp + Folders)
- [ ] **Segment 12:** Settings & Customization
- [ ] **Segment 5:** Client Inquiry System
- [ ] **Segment 8:** Search (FTS5)
- [ ] **Segment 10:** Public Pages
- [ ] **Segment 6:** Portal System (Magic Links)
- [ ] **Segment 11:** Homepage & Navigation
- [ ] **Segment 9:** Admin Dashboard UI
- [ ] **Segment 15:** Security Hardening & Testing

---

## Next Step

We start with **Segment 1: Database Schema & Migrations**.

Shall I create the detailed code plan for Segment 1 now?
