
```markdown
# Myah Travels

Personal website for Myah, a travel writer and agent. Built with Next.js, self-hosted on a mini PC.

## Tech Stack

- **Framework:** Next.js 14 (App Router, TypeScript)
- **Database:** SQLite (better-sqlite3, WAL mode)
- **ORM:** Drizzle
- **Auth:** Lucia Auth (admin with TOTP 2FA) + Magic Links (portal)
- **Editor:** TipTap
- **Email:** Resend (with queue)
- **Styling:** Tailwind CSS
- **Search:** SQLite FTS5
- **Deployment:** Self-hosted (Ubuntu Server + Cloudflare Tunnel)

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- Git

### Installation

```bash
git clone [your-repo-url]
cd myah-travels
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Fill in required values (see Environment Variables below)

### Database Setup

```bash
mkdir data
npm run db:migrate
npm run seed
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
npm run test
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite database path (default: `./data/site.db`) |
| `ADMIN_USERNAME` | Yes | Admin login username |
| `ADMIN_PASSWORD` | Yes | Admin password (for seed script) |
| `RESEND_API_KEY` | For email | Resend API key |
| `EMAIL_FROM` | For email | Sender address |
| `EMAIL_ADMIN_TO` | For email | Admin notification email |
| `CRON_SECRET` | Yes | Protects cron API routes |
| `RESEND_WEBHOOK_SECRET` | For email | Verifies Resend webhooks |
| `SITE_URL` | Yes | Full site URL (e.g., https://myahtravels.com) |
| `TURNSTILE_SITE_KEY` | For forms | Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | For forms | Cloudflare Turnstile |

---

## Production Deployment (Mini PC)

### Infrastructure Setup

1. Install Ubuntu Server LTS (with LUKS encryption)
2. Configure UFW firewall (default deny)
3. SSH key authentication only
4. Install Node.js 18+
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
3. Get API key
4. Configure webhook

### Deploy

```bash
cd /var/www/site
git pull origin main
npm ci
npm run db:migrate
npm run build
systemctl restart myahtravels
```

Or use the deploy script:

```bash
./scripts/deploy.sh
```

### Cron Jobs

```
# Daily backups (2:00 AM)
0 2 * * * /var/www/site/scripts/backup.sh

# Daily cleanup (3:00 AM)
0 3 * * * /var/www/site/scripts/cleanup-daily.sh

# Weekly cleanup (Sunday 4:00 AM)
0 4 * * 0 /var/www/site/scripts/cleanup-weekly.sh

# Email queue processor (every 5 minutes)
*/5 * * * * curl -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/email/process-queue

# Health check (hourly)
0 * * * * /var/www/site/scripts/health-check.sh
```

---

## Features

### Public Site
- Blog with rich text editor
- Destination guides with quick reference
- Reviews with ratings and pros/cons
- Video hub (YouTube embeds)
- Search (FTS5)
- Contact/inquiry form
- About, Privacy, FAQ pages

### Admin Dashboard
- Secure login with TOTP 2FA
- Content management (posts, guides, reviews)
- Media library with upload + deletion protection
- Client inquiry database with CSV export
- Portal management
- Settings (colors, fonts, logo, bio)

### Client Portal
- Magic link access (no passwords)
- Trip dates displayed prominently
- Notices with email notifications
- Document sharing
- FAQ per portal
- Global announcements
- Session management

### Automation
- Nightly backups (VACUUM INTO)
- Data retention cleanup
- Email queue processing
- Scheduled post publishing
- Health checks

---

## Documentation

- [SRS](./docs/SRS.md) - Full specification
- [Code Plan](./docs/CODE-PLAN.md) - Segment breakdown
- [Master Prompt](./docs/MASTER-PROMPT.md) - Context restoration
- [Todo](./docs/TODO.md) - Progress tracker

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run all tests |
| `npm run db:migrate` | Run database migrations |
| `npm run seed` | Seed default data |
| `npm run backup` | Run backup script |
| `npm run restore` | Run restore script |
| `npm run cleanup` | Run daily cleanup |
| `npm run health` | Run health check |

