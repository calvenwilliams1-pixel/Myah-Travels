# Myah Travels - MASTER-PROMPT.md

I am building a website called "Myah Travels" for a travel writer/agent.

---

## Current Status

**ALL CORE SEGMENTS AND CANVAS PHASES 1-16 COMPLETE. Testing + Bug Fixing in progress.**

Moveable fix merged to main. Remaining bugs being worked through.

---

## Project Overview

- Self-hosted Next.js 14 application on mini PC (Ubuntu Server)
- Cloudflare Tunnel
- SQLite (WAL mode) + Drizzle ORM
- Dual-mode editor: TipTap (Story) + Canvas (Design)
- Lucia Auth (TOTP 2FA)
- Resend email
- Client portal with magic links
- Facebook-style feed homepage
- Theme system

---

## Completion Status

### Core Segments (17) - ✅ COMPLETE

### Canvas Phases 1-15 - ✅ COMPLETE

### Phase 16: Dual-Mode Editor - ✅ COMPLETE

| Priority | Status |
|----------|--------|
| P0 (8 items) | ✅ |
| P1 (5 items) | ✅ |
| P2-3: Story canvas full editor | ✅ |
| P2-1: Per-element undo | Skipped |
| P2-2: Mobile touch | Deferred |

---

## Moveable Fix - ✅ MERGED

The outline offset bug was caused by Moveable being rendered OUTSIDE the canvas div. Fix: Moveable must be INSIDE the canvas container div.

**Affected files:**
- `components/editor/canvas/CanvasEditor.tsx` - ✅ Fixed
- `components/editor/canvas/MiniCanvasEditorFull.tsx` - ⏳ Fix ready, untested

---

## Remaining Bugs

| # | Issue | Priority |
|---|-------|----------|
| 1 | MiniCanvasEditorFull same outline fix | High |
| 2 | SmartBlock can't type (list/checklist/proscons) | High |
| 3 | Button URL not editable | High |
| 4 | Template save freezes | High |
| 5 | Manage templates empty | High |
| 6 | Save draft unresponsive | High |
| 7 | Colour pickers missing for many elements | Medium |
| 8 | Portal elements non-functional in Design mode | Medium |
| 9 | Divider styles (dotted/dashed/double) | Medium |
| 10 | Image fill for shapes/buttons | Medium |

---

## Key Architecture Decisions

| Decision | Choice |
|----------|--------|
| Position | Pixel-based at 800px |
| Responsive | transform: scale() |
| Mode | Locked at creation |
| Storage | SQLite JSON blobs |
| Undo/redo | Global (capped 50) |
| Autosave | 2s debounce |
| Rich text | TipTap JSON |
| Grouping | groupId |
| Clipboard | localStorage |

---

## How I Work

- Editing on GitHub website to avoid paste corruption
- Testing in Codespaces with git pull
- Submit code for AI review BEFORE creating
- Each file gets exact path + complete code
- When testing, use python3 scripts in Codespace for find/replace
- Always verify changes with grep or diff

---

## Testing Commands

```bash
npm run dev
npm run seed
npm run build
