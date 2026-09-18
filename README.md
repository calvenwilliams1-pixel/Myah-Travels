# MyCalTravels

Personal website and client portal platform for Myah, a travel writer and agent. Built with Next.js, self-hosted on a mini PC.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** SQLite (better-sqlite3, WAL mode)
- **ORM:** Drizzle
- **Auth:** Lucia Auth (admin with TOTP 2FA) + Magic Links (portal clients)
- **Rich Text:** TipTap 2.27 (block editor + renderers)
- **Email:** Resend (with queue)
- **Styling:** Tailwind CSS (semantic theme tokens, typography plugin)
- **Search:** SQLite FTS5
- **Testing:** Vitest + Testing Library (87 tests)
- **Deployment:** Self-hosted (Ubuntu Server + Cloudflare Tunnel)

## Core Architecture

**Block-Based Content** — Posts, guides, and reviews are composed of 10 semantic content blocks (Title, Body, Callout, Hero, Image, Gallery, QuickFacts, Quote, ProsCons, Verdict). Writer fills blocks; template controls layout; system controls design.

**Portal Wall** — Client-facing "Travel Information Wall" per trip. Content library (reusable) + portal-specific items + itineraries, all rendered in one unified pipeline. Access via magic link.

**Itinerary Builder** — Structured itinerary creation (sections, days, segments, stays) with beautiful client rendering and print-to-PDF export.

**Admin Notepad** — Private per-portal scratchpad for logistics with people tagging and search.

**Theme System** — Semantic colour tokens (primary, accent, status colours) driven by admin settings. Curated palettes; surface colours use named presets.

## Getting Started (Local Development)

### Prerequisites

- Node.js 22 LTS (recommended; Node 20 fails on `isomorphic-dompurify@4` / `jsdom@30`)
- Git

### Installation

```bash
git clone <your-repo-url>
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
node scripts/setup-db.js   # Create DB (schema + migrations + missing columns + seeds)
npm run seed               # Seed admin user, categories, tags, settings
```

`setup-db.js` handles all known schema drift. Do not use `npm run db:migrate` — that path is stale.

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### Default Admin Login

- Username: `myah`
- Password: `changeme` (change immediately!)

TOTP enrollment is gated by the `TOTP_ENFORCEMENT` env var. Leave it unset or `false` in dev — first production login will require an authenticator app.

### Run Tests

```bash
npm test                   # Run all tests (87 passing)
npm run test:watch         # Watch mode
npm run test:ui            # Vitest UI
npm run smoke              # Operational smoke scripts (needs a populated DB)
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
| `TOTP_ENFORCEMENT` | Production | `true` enables mandatory 2FA enrollment |
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
- Secure login with TOTP 2FA (env-gated)
- Block-based editor for posts/guides/reviews
- Rich text toolbar with font family, size, colour, highlight
- Template Creator (structural templates)
- Content Library (reusable PDFs, images, text)
- Portal management (create, edit, preview, archive)
- Itinerary Builder (sections, days, segments, stays, travel legs)
- Admin Notepad (per-portal, tag search)
- Media library
- Client inquiry database with CSV export
- Client Memory System (person pages, trip history, notes)
- Itinerary Library (live + archived, use-as-template)
- Site settings (theme, hero presets, curated palettes)

### Client Portal Wall
- Magic link access (no passwords)
- Hero banner (image or preset)
- Content tiles (PDF, image, text, itinerary)
- Full itinerary view with time-grouped segments
- Print / Save PDF export
- Mobile-responsive

### Editor
- Block-based vertical editor with 10 content types
- TipTap rich text with font, colour, highlight, size
- Toolbar with gradient tile styling (theme-driven)
- Right-click context menu with submenus (colour, size, font, align)
- Divider with configurable thickness and colour
- Picture-in-Picture preview (Chrome/Edge, draggable across monitors)
- Autosave (500ms debounce) + localStorage draft durability
- Save indicator with retry

### Content Schema Versioning
- Body content stored in a versioned envelope
- Backwards compatible with legacy bare-doc rows
- `deserializeBodyContent` handles both shapes transparently

## Documentation

- [Code Plan](./docs/CODE-PLAN.md) — Full file map
- [Master Prompt](./docs/MASTER-PROMPT.md) — Context restoration
- [Testing](./docs/TESTING.md) — Full testing checklist
- [Phase 7.9 + 9 Plan](./docs/PHASES-7.9-AND-9-PLAN.md) — Roadmap for client memory + post editor work
- [Itinerary Styling Plan](./docs/ITINERARY-STYLING-PLAN.md) — Phase 7.6.9 design notes
- [Audit](./docs/AUDIT.md) — Earlier findings
- [Attribution](./docs/ATTRIBUTION.md) — Static data sources (airports, airlines)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm test` | Run all vitest tests (87 passing) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:ui` | Vitest UI |
| `npm run smoke` | Operational smoke tests against a populated DB |
| `npm run seed` | Seed default data |
| `node scripts/setup-db.js` | Create/rebuild database |

## Known Issues

1. **better-sqlite3 crash in Codespace** — Environment-specific. Not present on local PC (Node 22) or mini PC deployment. Workaround: restart dev server, or test on local.

2. **Canvas system frozen** — Legacy Canvas editor files remain in `components/editor/canvas/`. Unwired from nav and from TipTap. Not reachable from any live path. Will be deleted when confirmed unnecessary.

3. **`schema.sql` outdated** — Missing newer columns. `scripts/setup-db.js` handles all known cases; use that instead.

## Development Workflow

- **Editing:** Codespace (VS Code, Python heredocs, Copilot)
- **Testing:** Local PC (no better-sqlite3 crash, real browser at localhost:3000)
- **Sync:** `git push` Codespace → `git pull` local → test → report bugs

## Production Deployment (Mini PC)

### Infrastructure Setup

1. Install Ubuntu Server LTS (with LUKS encryption)
2. Configure UFW firewall (default deny)
3. SSH key authentication only
4. Install Node.js 22 LTS
5. Install fail2ban
6. Enable unattended-upgrades

### Cloudflare Setup

1. Register domain
2. Add to Cloudflare
3. Set up Cloudflare Tunnel pointing at `http://localhost:3000`
4. Configure Turnstile

### Email Setup

1. Create Resend account
2. Verify domain (SPF, DKIM, DMARC)
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
# Email queue processor — every 1 minute
* * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/email/process-queue > /dev/null 2>&1

# Portal purge — daily at 3 AM
0 3 * * * cd /var/www/site && npx tsx scripts/purge-portals.ts >> /var/log/portal-purge.log 2>&1

# Daily backups — 2 AM
0 2 * * * /var/www/site/scripts/backup.sh
```

### Backups

- Encrypted with `age` before writing
- Minimum 7 daily + 4 weekly + 3 monthly
- Back up `data/site.db`, `public/uploads/`, `.env` (encrypted)
- Test a restore before launch

---

**Last Updated:** September 18, 2026
