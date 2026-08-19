# Updated MASTER-PROMPT.md - Paste This Into GitHub

---

```
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
Currently working on Segment 14: Backup & Deployment Scripts.

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

## Files Already Created (Segments 0, 1, 1.5, 2, 13a, 7 - Complete)

### Segment 0 (16 files):
- package.json (UPDATED: added svix)
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
- drizzle/schema/portals.ts
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
- lib/security/index.ts (UPDATED: rate limiter accepts Headers, getClientIp)

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

## Current Segment
Segment 14: Backup & Deployment Scripts (8 files)

## Next File To Create
scripts/backup.sh

## Task
Create backup, restore, deployment, cleanup, and health check scripts. Plus monitoring utilities and health endpoint.

## Review Criteria
- Scripts executable
- Backup uses safe method (VACUUM INTO)
- Restore documented
- Cleanup matches retention policy
- Health check functional
- Monitoring utilities work

## Previous Decisions
- Backups local only (same disk on mini PC)
- VACUUM INTO for database backups
- rsync for media backups
- Nightly database backup at 2:00 AM
- Weekly full system backup Sunday 3:00 AM
- Retention: 30 days daily, 90 days weekly
- Cleanup: sent emails 30 days, failed 90 days
- Activity logs: 12 months archive, 24 months delete
- Soft-deleted records: 90 days purge
- Magic links: 7 days expire
- Portal sessions: 30 days expire
- Health check at /api/health

## Progress Tracker (Current)

| Segment | Status | Files | Review |
|---------|--------|-------|--------|
| 0: Project Init | ✅ Complete | 16/16 | Approved |
| 1: Database | ✅ Complete | 33/33 | Approved |
| 1.5: Security Primitives | ✅ Complete | 1/1 | Approved |
| 2: Auth | ✅ Complete | 5/5 | Approved |
| 13a: Activity Logging | ✅ Complete | 1/1 | Approved |
| 7: Email | ✅ Complete | 5/5 | Approved |
| 14: Backup/Deploy | In Progress | 0/8 | Pending |
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

## Segment 14 Files To Create (In Order)

1. scripts/backup.sh
2. scripts/restore.sh
3. scripts/deploy.sh
4. scripts/cleanup-daily.sh
5. scripts/cleanup-weekly.sh
6. scripts/health-check.sh
7. lib/monitoring/index.ts (health, disk-space, database combined)
8. app/api/health/route.ts

Please provide the code file by file using the format above.
```

---

**Paste this into your MASTER-PROMPT.md file on GitHub, replacing the old content.**
