I am building a website called "Myah Travels" for a travel writer/agent. Here is the complete context:

## IMPORTANT: Auto-Update Instructions
At the end of EVERY response, you MUST provide me with:
1. The updated "Progress Tracker" section to paste into TODO.md
2. The updated "Files Already Created" list to paste into MASTER-PROMPT.md
3. The updated "Next File To Create" line for MASTER-PROMPT.md
4. A one-line summary of what was just completed

This ensures my documentation stays current even if I lose context.

## Current Status
Segment 0 is COMPLETE. All 16 files created on GitHub.
Segment 1 is COMPLETE. All 33 files created on GitHub.
Currently working on Segment 1.5: Security Primitives.

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
- Email queue for asynchronous sending
- Global announcements (renamed from "all-hands")
- Backups local only (VACUUM INTO method)
- LUKS full-disk encryption

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

## Files Already Created (Segments 0 and 1 - Complete)

### Segment 0 (16 files):
- package.json
- next.config.ts
- tsconfig.json
- drizzle.config.ts
- lib/db/index.ts
- lib/db/migrate.ts
- .env.example
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

## Current Segment
Segment 1.5: Security Primitives (3 files)

## Next File To Create
lib/security/rate-limit.ts

## Task
Create security utility files for rate limiting, input validation, and security headers.

## Review Criteria
- Rate limiting works per IP
- Validation functions comprehensive
- Headers match SRS Section 8
- TypeScript types correct
- No external dependencies beyond what's in package.json

## Previous Decisions
- Rate limiting: Login 5 attempts/15min, Forms 3/hour/IP
- IP-based rate limiting (not account-based)
- Validation for all user inputs
- Security headers in next.config.ts already
- Lucia Auth handles CSRF
- No additional dependencies needed

## Progress Tracker (Current)

| Segment | Status | Files | Review |
|---------|--------|-------|--------|
| 0: Project Init | ✅ Complete | 16/16 | Approved |
| 1: Database | ✅ Complete | 33/33 | Approved |
| 1.5: Security Primitives | In Progress | 0/3 | Pending |
| 2: Auth | Not Started | 0/9 | Pending |
| 13a: Activity Logging | Not Started | 0/2 | Pending |
| 7: Email | Not Started | 0/9 | Pending |
| 14: Backup/Deploy | Not Started | 0/11 | Pending |
| 3: Content | Not Started | 0/26 | Pending |
| 4: Media | Not Started | 0/9 | Pending |
| 12: Settings | Not Started | 0/7 | Pending |
| 5: Clients | Not Started | 0/9 | Pending |
| 8: Search | Not Started | 0/3 | Pending |
| 10: Public Pages | Not Started | 0/10 | Pending |
| 11: Homepage | Not Started | 0/10 | Pending |
| 6: Portal | Not Started | 0/14 | Pending |
| 9: Admin Dashboard | Not Started | 0/10 | Pending |
| 15: Security/Testing | Not Started | 0/10 | Pending |

## Segment 1.5 Files To Create (In Order)

1. lib/security/rate-limit.ts
2. lib/security/validation.ts
3. lib/security/headers.ts

Please provide the code file by file using the format above.
