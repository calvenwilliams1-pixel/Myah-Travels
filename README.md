# README Revision — Yes, Substantially

Here's what's outdated and what needs to change:

## What's Wrong

### 1. Project Name
- Currently: "Myah Travels"
- Should be: "MyCalTravels"
- The rename happened across the codebase but not in docs

### 2. Canvas System References
- The README implicitly suggests Canvas is current
- Canvas is FROZEN, pending deletion
- Features list mentions "Post Canvas" system - not accurate anymore

### 3. Missing Features
The README doesn't mention:
- Content Library
- Portal Wall (Travel Information Wall)
- Itinerary Builder
- Admin Notepad
- Block-based content system
- Autosave infrastructure
- Theme system (semantic tokens, curated palettes)

### 4. Database Setup Instructions Are Wrong

**Current README says:**
```bash
mkdir data
npm run db:migrate
npm run seed
```

**Reality:**
- `npm run db:migrate` doesn't work (migrations folder missing journal file)
- `schema.sql` is outdated
- `scripts/setup-db.js` is the correct path
- The README doesn't mention `setup-db.js`

### 5. Missing Environment Variables

**Current README has:**
- DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD
- RESEND_API_KEY, EMAIL_FROM, EMAIL_ADMIN_TO
- CRON_SECRET, RESEND_WEBHOOK_SECRET
- SITE_URL, TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY

**Missing:**
- `PORTAL_MAGIC_LINK_EXPIRY_DAYS`

**Also missing from the README's example:**
- Note that `RESEND_API_KEY=re_dummy_key_for_dev` is needed for admin pages to work in dev (we hit this repeatedly)

### 6. Features List is Outdated

**Current says:**
> Client Portal — Magic link access, Trip dates, Notices with email notifications, Document sharing, FAQ per portal, Global announcements, Session management

**Reality:**
- Notices were REMOVED (redundant with Alert category)
- Document sharing and FAQs are legacy (not rendered)
- Portal Wall is the actual client interface now
- Itinerary + Admin Notepad are new

**Current says:**
> Public Site — Blog with rich text editor, Destination guides, Reviews with ratings and pros/cons

**Reality:**
- Blog now uses block system (10 blocks)
- Guides/reviews same
- Feed homepage with filters
- Content Library

### 7. Documentation Links Are Wrong

**Current:**
```
[SRS](./docs/SRS.md)
[Code Plan](./docs/CODE-PLAN.md)
[Master Prompt](./docs/MASTER-PROMPT.md)
[Todo](./docs/TODO.md)
```

**Reality:**
- Docs are at repo root, not `./docs/`
- Filenames have spaces: `SRS Plan`, `code plan.md`, `MASTER-PROMPT.md`, `todo list`
- Should reference the new versions we just wrote (SRS v5.0, CODE-PLAN Revision 3, TODO Revision 4, MASTER-PROMPT Revision 2)

### 8. Scripts Table Needs Updates

**Current scripts listed:**
- `db:migrate` — doesn't work as-is
- `backup`, `restore`, `cleanup`, `health` — may or may not exist

**Should add:**
- `setup-db.js` (the working DB setup path)
- `test:watch`, `test:ui` (we added these)
- Correct the DB setup command

### 9. Missing "Known Issues" Section

Should include:
- better-sqlite3 crash in Codespace (environment-specific)
- Canvas system frozen (39 emerald references remain)
- Native date/time picker limitations (Phase 7 bug fix)
- schema.sql outdated

### 10. Testing Section Is Underspecified

**Current:**
> Run tests: `npm run test`

**Reality:**
- 48 tests across 3 suites
- Vitest + Testing Library
- Specific commands for watch/UI modes

### 11. Deployment Section

The deployment section looks mostly correct but could be improved:
- No mention of `scripts/setup-db.js`
- Doesn't mention backup of `data/` folder
- Doesn't note that `RESEND_API_KEY` must be real in production

---

## Recommended Revision

Here's a full rewrite of the README that matches current reality:

```markdown
# MyCalTravels

Personal website and client portal platform for Myah, a travel writer and agent. Built with Next.js, self-hosted on a mini PC.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** SQLite (better-sqlite3, WAL mode)
- **ORM:** Drizzle
- **Auth:** Lucia Auth (admin with TOTP 2FA) + Magic Links (portal clients)
- **Rich Text:** TipTap
- **Email:** Resend (with queue)
- **Styling:** Tailwind CSS (semantic theme tokens)
- **Search:** SQLite FTS5
- **Testing:** Vitest + Testing Library
- **Deployment:** Self-hosted (Ubuntu Server + Cloudflare Tunnel)

## Core Architecture

**Block-Based Content** — Posts, guides, and reviews are composed of 10 semantic content blocks (Title, Body, Callout, Hero, Image, Gallery, QuickFacts, Quote, ProsCons, Verdict). Writer fills blocks; template controls layout; system controls design.

**Portal Wall** — Client-facing "Travel Information Wall" per trip. Content library (reusable) + portal-specific items + itineraries, all rendered in one unified pipeline. Access via magic link.

**Itinerary Builder** — Structured itinerary creation (sections, days, segments, stays) with beautiful client rendering and print-to-PDF export.

**Admin Notepad** — Private per-portal scratchpad for logistics with people tagging and search.

**Theme System** — Semantic colour tokens (primary, accent, status colours) driven by admin settings. Curated palettes; no free-form colour pickers.

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+ (Node 20 recommended)
- Git

### Installation

```bash
git clone [your-repo-url]
cd Myah-Travels
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in values (see Environment Variables below).

For local dev, at minimum:
```
DATABASE_URL=./data/site.db
ADMIN_USERNAME=myah
ADMIN_PASSWORD=changeme
RESEND_API_KEY=re_dummy_key_for_dev
SITE_URL=http://localhost:3000
```

`RESEND_API_KEY` must be present (dummy value is fine) for admin pages to load.

### Database Setup

```bash
node scripts/setup-db.js   # Create DB (schema + migrations + missing columns)
npm run seed               # Seed admin user, categories, tags, settings, templates
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Default Admin Login

- Username: `myah`
- Password: `changeme` (change immediately!)

### Run Tests

```bash
npm test                   # Run all tests (48 passing)
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path (default: `./data/site.db`) |
| `ADMIN_USERNAME` | Yes | Admin login username |
| `ADMIN_PASSWORD` | Yes | Admin password (for seed script) |
| `RESEND_API_KEY` | Yes | Resend API key (dummy OK in dev) |
| `EMAIL_FROM` | For email | Sender address |
| `EMAIL_ADMIN_TO` | For email | Admin notification email |
| `CRON_SECRET` | Yes | Protects cron API routes |
| `RESEND_WEBHOOK_SECRET` | For email | Verifies Resend webhooks |
| `SITE_URL` | Yes | Full site URL |
| `PORTAL_MAGIC_LINK_EXPIRY_DAYS` | Optional | Magic link expiry (default 7) |
| `TURNSTILE_SITE_KEY` | For forms | Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | For forms | Cloudflare Turnstile |

## Features

### Public Site
- Feed homepage with filters (type, category, sort)
- Pin/highlight support
- Blog, Destination Guides, Reviews (block-based)
- Video hub (YouTube embeds)
- Search (FTS5)
- Contact/inquiry form

### Admin Dashboard
- Secure login with TOTP 2FA
- Block-based editor for posts/guides/reviews
- Template Creator (structural templates)
- Content Library (reusable PDFs, images, text)
- Portal management (create, edit, preview, archive)
- Itinerary Builder (sections, days, segments, stays)
- Admin Notepad (per-portal, tag search)
- Media library
- Client inquiry database with CSV export
- Site settings (theme, hero presets, curated palettes)

### Client Portal Wall
- Magic link access (no passwords)
- Hero banner (image or preset)
- Content tiles (PDF, image, text, itinerary)
- Full itinerary view with time-grouped segments
- Print / Save PDF export
- Mobile-responsive

### Autosave Infrastructure
- Debounced save (500ms)
- localStorage draft durability (survives crashes)
- Save status indicator
- Flush on blur, unmount, tab close
- Retry on error

## Documentation

- [SRS](./SRS%20Plan) — Full specification (v5.0)
- [Code Plan](./code%20plan.md) — Full file map (Revision 3)
- [Master Prompt](./MASTER-PROMPT.md) — Context restoration (Revision 2)
- [Todo](./todo%20list) — Progress tracker (Revision 4)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run all vitest tests (48 passing) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:ui` | Vitest UI |
| `npm run seed` | Seed default data |
| `node scripts/setup-db.js` | Create/rebuild database |

## Known Issues

1. **better-sqlite3 crash in Codespace** — Environment-specific. Not present on local PC or mini PC deployment. Workaround: restart dev server.

2. **Canvas system frozen** — Legacy Canvas editor files remain in `components/editor/canvas/` with 39 hardcoded emerald references. Pending deletion.

3. **Native date/time pickers** — Chromium date/time inputs highlight text instead of opening the picker. Fix in progress (Phase 7).

4. **Segment edits revert on collapse** — Itinerary segment fields lose unsaved edits when collapsed. Fix in progress (Phase 7).

## Development Workflow

- **Editing:** Codespace (VS Code, Python heredocs, Copilot)
- **Testing:** Local PC (no better-sqlite3 crash, real browser at localhost:3000)
- **Sync:** `git push` Codespace → `git pull` local → test → report bugs

## Production Deployment (Mini PC)

### Infrastructure Setup

1. Install Ubuntu Server LTS (with LUKS encryption)
2. Configure UFW firewall (default deny)
3. SSH key authentication only
4. Install Node.js 20+
5. Install nginx (reverse proxy)
6. Install fail2ban
7. Enable unattended-upgrades

### Cloudflare Setup

1. Register domain
2. Add to Cloudflare
3. Set up Cloudflare Tunnel
4. Configure Turnstile
5. Enable Web Analytics

### Email Setup

1. Create Resend account
2. Verify domain
3. Get API key (real key required in production)
4. Configure webhook

### Deploy

```bash
cd /var/www/site
git pull origin main
npm ci
node scripts/setup-db.js   # Only on first deploy
npm run build
systemctl restart mycaltravels
```

### Cron Jobs

```
# Daily backups (2:00 AM)
0 2 * * * /var/www/site/scripts/backup.sh

# Daily cleanup (3:00 AM)
0 3 * * * /var/www/site/scripts/cleanup-daily.sh

# Email queue processor (every 5 minutes)
*/5 * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/email/process-queue
```

---

**Last Updated:** September 12, 2026
```

---

## Summary of Changes

| Section | Change |
|---------|--------|
| Title | Myah Travels → MyCalTravels |
| Tech Stack | Added Vitest + Testing Library |
| Architecture | New section explaining block system, portal wall, itinerary, notepad |
| Database Setup | `db:migrate` → `node scripts/setup-db.js` |
| Env Vars | Added `PORTAL_MAGIC_LINK_EXPIRY_DAYS`, clarified `RESEND_API_KEY` dummy note |
| Features | Rewrote to match current reality (block system, portal wall, itinerary, notepad, autosave) |
| Documentation Links | Fixed paths (files at root with spaces) |
| Scripts Table | Removed nonexistent scripts, added test commands, `setup-db.js` |
| Known Issues | New section: Codespace crash, frozen Canvas, picker bugs, segment revert |
| Development Workflow | New section |
| Production Deployment | Corrected deploy sequence |

**Shall I write this revised README to the repo?** Just confirm and I'll produce the Python command.