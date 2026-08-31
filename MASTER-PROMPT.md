Yes. Let's update MASTER-PROMPT with the new direction.

---

## File: Replace `MASTER-PROMPT.md` on GitHub

**On GitHub (main branch):**
1. Go to `MASTER-PROMPT.md`
2. Click pencil icon
3. Delete ALL content
4. Paste:

```markdown
# Myah Travels - MASTER-PROMPT.md

I am building a website called "Myah Travels" for a travel writer/agent.

---

## Current Status

**Core code complete. Bug fixing + UX improvements in progress.**

Recently fixed: Moveable outline, button editing, SmartBlock editing, properties popup, opacity/border sliders.

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

## NEW DIRECTION (After Myah's Feedback)

| Priority | Area | Why |
|----------|------|-----|
| 1 | Story mode post creation | Core business - writing |
| 2 | Portal system | Client value |
| 3 | Design mode | Low - Canva replacement later |

### Story Mode
- Remove mode selector (Story = default)
- Add block elements (image, shape, divider) to TipTap
- Fix or replace MiniCanvasEditorFull
- Keep it simple for writing

### Portal System
- Magic links
- Member access
- Notices + documents
- Client trip planning

### Design Mode (Deferred)
- Keep as separate Canva-like tool
- Flesh out later

---

## Recently Fixed (Working)

| Fix | Status |
|-----|--------|
| Moveable outline offset | ✅ |
| Button border/opacity | ✅ |
| Button edit form focus | ✅ |
| Button URL editing | ✅ |
| SmartBlock editing | ✅ |
| Properties popup (right-click) | ✅ |
| Popup drag + lock | ✅ |
| Opacity/corner/border sliders | ✅ |
| Divider thickness/colour | ✅ |

---

## Known Issues

| # | Issue | Priority |
|---|-------|----------|
| 1 | SmartBlock selection/move | High |
| 2 | SmartBlock content doesn't fill | High |
| 3 | Template save freezes | High |
| 4 | Manage templates empty | High |
| 5 | Save draft unresponsive | High |
| 6 | Marquee doesn't select SmartBlocks | Medium |
| 7 | Portal elements non-functional | Medium |
| 8 | Divider styles | Medium |
| 9 | Image fill | Medium |

---

## Key Architecture Decisions

| Decision | Choice |
|----------|--------|
| Position | Pixel-based at 800px |
| Responsive | transform: scale() |
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
- Use python3 scripts in Codespace for find/replace
- Always verify changes with grep or diff

---

## Testing Commands

```bash
npm run dev
npm run seed
npm run build
```

---

## ⚠️ TEMPORARY: Auth Disabled For Testing

Two files modified for testing:
1. `middleware.ts` - Auth checks disabled
2. `lib/auth/index.ts` - requireAuth returns first user

**Revert instructions in TODO.md**
```

5. Commit: "Update MASTER-PROMPT with new direction"

---

**Tell me when done.**
