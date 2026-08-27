# Myah Travels - CODE-PLAN.md (Current)

## Overview

All 17 original segments COMPLETE. Canvas Phases 1-15 COMPLETE. Phase 16 (Dual-Mode Editor) COMPLETE. Bug fixing in progress.

---

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS, Lucia Auth, TipTap, react-moveable 0.56.0, DOMPurify

---

## Moveable Fix - Merged

**Bug:** Moveable outline offset from elements.

**Root cause:** Moveable rendered OUTSIDE the canvas div. Moveable's control box uses page coordinates, needs to be inside the positioned container.

**Fix:** Move Moveable JSX inside the canvas container div.

**Files:**
- CanvasEditor.tsx ✅ Fixed
- MiniCanvasEditorFull.tsx ⏳ Fix ready

---

## Remaining Work

### High Priority
1. MiniCanvasEditorFull outline fix (test)
2. SmartBlock inline editing
3. Button URL field
4. Template save freeze
5. Manage templates empty
6. Save draft unresponsive

### Medium Priority
7. Colour pickers
8. Portal properties
9. Divider styles
10. Image fill

---

## Testing Setup

- Codespaces for testing
- Auth bypassed (see MASTER-PROMPT)
- Database recreated via schema.sql + npm run seed
- .env has dummy Resend key
