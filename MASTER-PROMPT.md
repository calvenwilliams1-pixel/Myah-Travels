Understood. Keep the revert instructions in MASTER-PROMPT.

---

## Replace `MASTER-PROMPT.md` on GitHub with this:

```markdown
# Myah Travels - MASTER-PROMPT.md

I am building a website called "Myah Travels" for a travel writer/agent.

---

## Current Status

**ALL CORE SEGMENTS AND CANVAS PHASES 1-16 COMPLETE. Testing in Codespaces.**

~210 files on GitHub.

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

---

## Known Issues

| Issue | Priority | Status |
|-------|----------|--------|
| [key: string]: any | Low | Accepted |
| Mobile touch | Low | Deferred |

---

## Testing Commands

```bash
npm run dev
npm run seed
npm run build
```

---

## ⚠️ TEMPORARY: Auth Disabled For Testing

Two files were modified to bypass authentication:

1. `middleware.ts` - Auth checks disabled (matcher: [])
2. `lib/auth/index.ts` - requireAuth() returns first user without session check

### How To Revert When Ready For Security

**Step 1:** Restore `middleware.ts` with the REAL version:

```tsx
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const sessionId = req.cookies.get("auth_session")?.value ?? null;

  if (!sessionId) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

**Step 2:** Restore `lib/auth/index.ts` with the REAL version (with proper requireAuth that checks sessions and redirects to login).

**Step 3:** Commit both with message "Restore authentication".

**Step 4:** In Codespace/local: `git pull`, `rm -rf .next`, `npm run dev`

**Step 5:** Test login flow works again.
```

---

**Replace the file on GitHub. Commit with "Clean MASTER-PROMPT with revert instructions".**

---

Then proceed with editing `middleware.ts` and `lib/auth/index.ts` for the temporary auth bypass.
