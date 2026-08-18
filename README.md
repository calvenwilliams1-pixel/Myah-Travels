# Myah Travels

Personal website for Myah, a travel writer and agent. Built with Next.js, self-hosted on a mini PC.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite (better-sqlite3, WAL mode)
- **ORM:** Drizzle
- **Auth:** Lucia Auth (admin) + Magic Links (portal)
- **Editor:** TipTap
- **Email:** Resend
- **Styling:** Tailwind CSS
- **Deployment:** Self-hosted (Ubuntu Server + Cloudflare Tunnel)

## Getting Started

### Prerequisites

- Node.js 18+
- SQLite

### Installation

```bash
npm install

Configuration
Copy .env.example to .env

Fill in all required values

Database
bash
mkdir data
npm run db:migrate
npm run seed
Development
bash
npm run dev
Production
bash
npm run build
npm run start
Documentation
SRS

Code Plan

Todo List

Master Prompt
