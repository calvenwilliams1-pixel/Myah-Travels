# Revised CODE-PLAN.md - With File Combining Rules

---

# Code Planning Phase - Segmentation Strategy

## Overview

We'll break the project into logical segments that can be developed independently, reviewed by AI at each stage, and merged later. Each segment will have its own code plan, review cycle, and GitHub branch.

---

## File Combining Rules (Reduces File Count)

### Rule 1: Utility Functions Combine
Related utility functions go in ONE file with an `index.ts` naming convention.

| Segment | Original Files | Combined File |
|---------|---------------|---------------|
| Security | rate-limit.ts, validation.ts, headers.ts | lib/security/index.ts |
| Auth | lucia.ts, totp.ts, password.ts, session.ts | lib/auth/index.ts |
| Email | resend.ts, queue.ts | lib/email/index.ts |
| Email Templates | magic-link.ts, inquiry-notification.ts, portal-notice.ts, global-announcement.ts | lib/email/templates.ts |
| Media | upload.ts, optimize.ts, folders.ts, usage.ts, delete.ts, replace.ts | lib/media/index.ts |
| Settings | site.ts, navigation.ts, homepage.ts, colors.ts, fonts.ts | lib/settings/index.ts |
| Monitoring | health.ts, disk-space.ts, database.ts | lib/monitoring/index.ts |
| Search | query.ts, extract.ts | lib/search/index.ts |
| Portal Lib | magic-link.ts, sessions.ts, notices.ts, documents.ts, faqs.ts, access-log.ts | lib/portal/index.ts |
| Clients Lib | inquiries.ts, merge.ts, anonymize.ts | lib/clients/index.ts |
| Content Lib | posts.ts, guides.ts, reviews.ts, tags.ts, categories.ts, extract-text.ts | lib/content/index.ts |
| Logging | activity.ts, middleware.ts | lib/logging/index.ts |
| Jobs | scheduled-posts.ts, data-retention.ts, email-processor.ts | lib/jobs/index.ts |

### Rule 2: Next.js Routes Stay Separate
Files in `app/` directory MUST stay separate because Next.js uses file-based routing.

| Example | Route |
|---------|-------|
| app/admin/login/page.tsx | /admin/login |
| app/admin/posts/page.tsx | /admin/posts |
| app/api/upload/route.ts | /api/upload |

### Rule 3: Database Schema Stays Separate
Drizzle ORM convention: one table per file in `drizzle/schema/`.

### Rule 4: Shell Scripts Stay Separate
Each shell script in `scripts/` is independently executable.

### Rule 5: UI Components Stay Separate
Each component in `components/` is imported independently. Reusable.

### Rule 6: Email Templates Combine
All email templates in one `templates.ts` file. They're just string functions.

---

## Revised File Count

| Phase | Segment | Original Files | Combined Files |
|-------|---------|---------------|----------------|
| 0 | Project Init | 16 | 16 (no change) |
| 1 | Database | 33 | 33 (no change - schema convention) |
| 1.5 | Security | 3 | **1** |
| 2 | Auth | 9 | **5** |
| 13a | Activity Logging | 2 | **1** |
| 7 | Email | 9 | **5** |
| 14 | Backup/Deploy | 11 | **8** |
| 3 | Content | 26 | **14** |
| 4 | Media | 9 | **5** |
| 12 | Settings | 7 | **3** |
| 5 | Clients | 9 | **6** |
| 8 | Search | 3 | **2** |
| 10 | Public Pages | 10 | 10 (no change - routes) |
| 11 | Homepage | 10 | 10 (no change - components) |
| 6 | Portal | 14 | **9** |
| 9 | Admin Dashboard | 10 | **8** |
| 15 | Security/Testing | 10 | **7** |
| **Total** | | **192** | **~130** |

---

## Proposed Development Segments

| Segment | Name | Dependencies | Priority | Est. Complexity | Files |
|---------|------|--------------|----------|-----------------|-------|
| 0 | Project Initialization | None | Critical | Low | 16 |
| 1 | Database Schema & Migrations | None | Critical | Medium | 33 |
| 1.5 | Security Primitives | Segment 1 | Critical | Low | 1 |
| 2 | Authentication (Admin) | Segments 1, 1.5 | Critical | High | 5 |
| 13a | Activity Logging Library | Segments 1, 2 | Medium | Low | 1 |
| 7 | Email System | Segment 1 | High | Medium | 5 |
| 14 | Backup & Deployment | Segment 1 | Medium | Low | 8 |
| 3 | Content Management | Segments 1, 2 | Critical | High | 14 |
| 4 | Media Library | Segments 1, 2 | High | Medium | 5 |
| 12 | Settings & Customization | Segments 1, 2 | Medium | Medium | 3 |
| 5 | Client Inquiry System | Segments 1, 2 | High | Medium | 6 |
| 8 | Search (FTS5) | Segments 1, 3 | Medium | Low | 2 |
| 10 | Public Pages | Segments 1, 3 | High | Medium | 10 |
| 11 | Homepage & Navigation | Segments 1, 3, 10 | Medium | Medium | 10 |
| 6 | Portal System | Segments 1, 2, 7 | High | High | 9 |
| 9 | Admin Dashboard UI | Segments 2, 3, 5, 6 | High | High | 8 |
| 15 | Security Hardening & Testing | All | Critical | High | 7 |

---

## Recommended Build Order

```
Phase 0: Project Setup
└── Segment 0: Project Initialization ✅ COMPLETE

Phase 1: Foundation
├── Segment 1: Database Schema & Migrations ✅ COMPLETE
├── Segment 1.5: Security Primitives
├── Segment 2: Authentication
├── Segment 13a: Activity Logging Library
├── Segment 7: Email System
└── Segment 14: Backup & Deployment Scripts

Phase 2: Core Features
├── Segment 3: Content Management
├── Segment 4: Media Library
└── Segment 12: Settings & Customization

Phase 3: Business Features
├── Segment 5: Client Inquiry System
├── Segment 8: Search
├── Segment 10: Public Pages
└── Segment 11: Homepage & Navigation

Phase 4: Portal System
└── Segment 6: Portal System (Magic Links)

Phase 5: Integration & Polish
├── Segment 9: Admin Dashboard UI
└── Segment 15: Security Hardening & Testing
```

---

## Detailed Segment Breakdown (With Combined Files)

### Segment 1.5: Security Primitives (1 file)

**File to create:**
```
lib/security/index.ts
```

**Contains:**
- Rate limiting (IP-based)
- Input validation utilities
- Security headers constant

---

### Segment 2: Authentication (5 files)

**Files to create:**
```
lib/auth/index.ts              ← Combined: lucia, totp, password, session
middleware.ts                  ← Root middleware
app/admin/login/page.tsx       ← Login page
app/admin/login/actions.ts     ← Login server actions
app/admin/layout.tsx           ← Protected layout
```

---

### Segment 13a: Activity Logging Library (1 file)

**File to create:**
```
lib/logging/index.ts           ← Combined: activity, middleware
```

---

### Segment 7: Email System (5 files)

**Files to create:**
```
lib/email/index.ts             ← Combined: resend, queue
lib/email/templates.ts         ← Combined: all 4 templates
app/api/email/process-queue/route.ts
app/api/email/status/route.ts
app/api/email/webhook/route.ts
```

---

### Segment 14: Backup & Deployment (8 files)

**Files to create:**
```
scripts/backup.sh
scripts/restore.sh
scripts/deploy.sh
scripts/cleanup-daily.sh
scripts/cleanup-weekly.sh
scripts/health-check.sh
lib/monitoring/index.ts        ← Combined: health, disk-space, database
app/api/health/route.ts
```

---

### Segment 3: Content Management (14 files)

**Files to create:**
```
lib/content/index.ts           ← Combined: posts, guides, reviews, tags, categories, extract-text
components/editor/TipTapEditor.tsx
components/editor/Toolbar.tsx
components/editor/blocks/CalloutBox.tsx
components/editor/blocks/YouTubeEmbed.tsx
components/editor/blocks/InstagramCard.tsx
components/editor/blocks/FileDownload.tsx
app/admin/posts/page.tsx
app/admin/posts/new/page.tsx
app/admin/posts/[id]/page.tsx
app/admin/posts/actions.ts
app/admin/guides/page.tsx
app/admin/guides/[id]/page.tsx
app/admin/reviews/page.tsx
app/admin/reviews/[id]/page.tsx
```

---

### Segment 4: Media Library (5 files)

**Files to create:**
```
lib/media/index.ts             ← Combined: upload, optimize, folders, usage, delete, replace
app/admin/media/page.tsx
app/admin/media/actions.ts
app/api/upload/route.ts
```

---

### Segment 12: Settings (3 files)

**Files to create:**
```
lib/settings/index.ts          ← Combined: site, navigation, homepage, colors, fonts
app/admin/settings/page.tsx
app/admin/settings/actions.ts
```

---

### Segment 5: Client Inquiry (6 files)

**Files to create:**
```
lib/clients/index.ts           ← Combined: inquiries, merge, anonymize
app/contact/page.tsx
app/contact/actions.ts
app/api/inquiries/route.ts
app/admin/clients/page.tsx
app/admin/clients/[id]/page.tsx
```

---

### Segment 8: Search (2 files)

**Files to create:**
```
lib/search/index.ts            ← Combined: query, extract
app/search/page.tsx
app/api/search/route.ts
```

---

### Segment 10: Public Pages (10 files - No Change)

**Files to create:**
```
app/(public)/blog/page.tsx
app/(public)/blog/[slug]/page.tsx
app/(public)/guides/page.tsx
app/(public)/guides/[slug]/page.tsx
app/(public)/reviews/page.tsx
app/(public)/reviews/[slug]/page.tsx
app/(public)/videos/page.tsx
app/(public)/about/page.tsx
app/(public)/privacy/page.tsx
app/(public)/faq/page.tsx
```

---

### Segment 11: Homepage & Navigation (10 files - No Change)

**Files to create:**
```
components/layout/Header.tsx
components/layout/Footer.tsx
components/layout/Navigation.tsx
components/layout/Certifications.tsx
components/homepage/HeroSection.tsx
components/homepage/AboutBlurb.tsx
components/homepage/FeaturedContent.tsx
components/homepage/FeaturedVideo.tsx
components/homepage/CallToAction.tsx
app/(public)/page.tsx
```

---

### Segment 6: Portal System (9 files)

**Files to create:**
```
lib/portal/index.ts            ← Combined: magic-link, sessions, notices, documents, faqs, access-log
app/admin/portals/page.tsx
app/admin/portals/new/page.tsx
app/admin/portals/[id]/page.tsx
app/admin/portals/actions.ts
app/portal/access/[token]/page.tsx
app/portal/consume/[token]/route.ts
app/portal/[portalSlug]/page.tsx
```

---

### Segment 9: Admin Dashboard UI (8 files)

**Files to create:**
```
app/admin/page.tsx
app/admin/components/Sidebar.tsx
app/admin/components/QuickActions.tsx
app/admin/components/RecentPosts.tsx
app/admin/components/ClientInquiries.tsx
app/admin/components/ActivePortals.tsx
app/admin/components/RecentActivity.tsx
app/admin/components/StorageUsage.tsx
```

---

### Segment 15: Security & Testing (7 files)

**Files to create:**
```
lib/jobs/index.ts              ← Combined: data-retention, email-processor, scheduled-posts
tests/auth.test.ts
tests/content.test.ts
tests/portal.test.ts
tests/clients.test.ts
tests/search.test.ts
tests/integration.test.ts
```

---

## GitHub Repository Structure

```
myah-travels/
├── app/
│   ├── (public)/
│   ├── admin/
│   ├── portal/
│   └── api/
├── components/
│   ├── ui/
│   ├── editor/
│   ├── layout/
│   └── homepage/
├── lib/
│   ├── db/
│   ├── auth/
│   ├── security/
│   ├── logging/
│   ├── email/
│   ├── content/
│   ├── media/
│   ├── clients/
│   ├── portal/
│   ├── search/
│   ├── settings/
│   ├── monitoring/
│   └── jobs/
├── scripts/
├── drizzle/
│   ├── schema/
│   └── migrations/
├── tests/
├── .env.example
├── package.json
└── README.md
```

---

## Progress Tracker

| Segment | Status | Files | Review |
|---------|--------|-------|--------|
| 0: Project Init | ✅ Complete | 16/16 | Approved |
| 1: Database | ✅ Complete | 33/33 | Approved |
| 1.5: Security Primitives | Not Started | 0/1 | Pending |
| 2: Auth | Not Started | 0/5 | Pending |
| 13a: Activity Logging | Not Started | 0/1 | Pending |
| 7: Email | Not Started | 0/5 | Pending |
| 14: Backup/Deploy | Not Started | 0/8 | Pending |
| 3: Content | Not Started | 0/14 | Pending |
| 4: Media | Not Started | 0/5 | Pending |
| 12: Settings | Not Started | 0/3 | Pending |
| 5: Clients | Not Started | 0/6 | Pending |
| 8: Search | Not Started | 0/2 | Pending |
| 10: Public Pages | Not Started | 0/10 | Pending |
| 11: Homepage | Not Started | 0/10 | Pending |
| 6: Portal | Not Started | 0/9 | Pending |
| 9: Admin Dashboard | Not Started | 0/8 | Pending |
| 15: Security/Testing | Not Started | 0/7 | Pending |

---

## Next Step

**Segment 1.5: Security Primitives** (1 file: `lib/security/index.ts`)

---

**Paste this entire document into your CODE-PLAN.md on GitHub, replacing the old content.**
