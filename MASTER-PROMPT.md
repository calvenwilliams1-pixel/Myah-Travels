## Update MASTER-PROMPT.md

**Do this one thing:**
Click the pencil icon on `MASTER-PROMPT.md`

**Replace the entire file with:**

```markdown
# Myah Travels - MASTER-PROMPT.md

I am building a website called "Myah Travels" for a travel writer/agent. Here is the complete context:

---

## Current Status

**ALL CORE SEGMENTS AND CANVAS PHASES 1-16 COMPLETE. Testing pending on home PC.**

~210 files created on GitHub. Local testing setup ready.

---

## Project Overview

- Self-hosted Next.js 14 application on a mini PC (Ubuntu Server)
- Cloudflare Tunnel for external access
- SQLite database (WAL mode)
- Drizzle ORM
- Dual-mode editor: TipTap (Story) + Canvas (Design)
- Lucia Auth (TOTP 2FA)
- Resend email
- Client portal with magic links
- PIPEDA compliance
- Facebook-style feed homepage
- Theme system (admin-controlled colors/background)

---

## Completion Status

### Core Segments (17) - ✅ COMPLETE (~170 files)

### Canvas Design System - ✅ Phases 1-15 COMPLETE

### Phase 16: Dual-Mode Editor - ✅ COMPLETE

| Sub-phase | Status |
|-----------|--------|
| P0-1: Mode selection UI | ✅ |
| P0-2: Canvas responsive scale | ✅ |
| P0-3: Editable canvas windows | ✅ |
| P0-4: Grouping | ✅ |
| P0-5: Marquee selection | ✅ |
| P0-6: Hex color picker | ✅ |
| P0-7: Image crop | ✅ |
| P0-8: Button new tab | ✅ |
| P1-1: Rich text in canvas | ✅ |
| P1-2: Text formatting toolbar | ✅ |
| P1-3: Triangle shape | ✅ |
| P1-4: Right-click context menu | ✅ |
| P1-5: Cross-post copy/paste | ✅ |
| Mode wiring (posts/guides/reviews) | ✅ |
| Edit pages mode-aware | ✅ |
| CanvasScaler integration | ✅ |
| DOMPurify | ✅ |
| Image/PDF URL sanitization | ✅ |
| P2-3: Story canvas full editor | ✅ |
| P2-1: Per-element undo | Skipped (global works) |
| P2-2: Mobile touch editing | Deferred |

---

## Key Architecture Decisions

| Decision | Choice |
|----------|--------|
| Position/size | Pixel-based at 800px design width |
| Responsive | `transform: scale()` via CanvasScaler |
| Mode | `story` or `design`, locked at creation |
| Storage | SQLite with JSON blobs |
| Undo/redo | Global (capped 50) |
| Autosave | 2s debounce |
| Rich text | TipTap JSON in `richText` field |
| Grouping | `groupId` on elements |
| Templates | Snapshot at save time |
| Clipboard | localStorage for cross-post |

---

## Files Created (Current Inventory)

### Canvas System
```
components/editor/canvas/
├── CanvasEditor.tsx
├── CanvasRenderer.tsx
├── CanvasScaler.tsx
├── MarqueeSelection.tsx
├── MiniCanvasEditor.tsx
├── MiniCanvasEditorFull.tsx
├── ImageCropOverlay.tsx
├── ElementCatalog.tsx
├── PropertiesPanel.tsx
├── LayersPanel.tsx
├── TemplateManager.tsx
├── SaveTemplateModal.tsx
├── PublishControls.tsx
├── ContextMenu.tsx
└── elements/
    ├── TextElementView.tsx (rich text)
    ├── TextFormatToolbar.tsx
    ├── ImageElementView.tsx (crop)
    ├── ShapeElementView.tsx (triangle)
    ├── SmartBlockElementView.tsx
    ├── ButtonElementView.tsx
    ├── PdfElementView.tsx
    ├── PortalDatesElementView.tsx
    ├── PortalNoticesElementView.tsx
    ├── PortalDocumentsElementView.tsx
    └── PortalFaqsElementView.tsx
```

### Editor Integration
```
components/editor/
├── TipTapEditor.tsx
├── TipTapRenderer.tsx
├── Toolbar.tsx
├── CanvasBlockNode.tsx
├── CanvasBlockComponent.tsx
├── CanvasBlockRenderer.tsx
├── InsertCanvasBlockButton.tsx
└── ModeSelectorModal.tsx
```

### Feed System
```
components/feed/
├── FeedCard.tsx
├── FeedContainer.tsx
├── FeedFilters.tsx
├── FeedPage.tsx
├── InfiniteFeed.tsx
└── types.ts
```

### Theme + Admin + UI
```
components/theme/ThemeProvider.tsx
components/admin/FeedAdminControls.tsx
components/ui/ColorPicker.tsx
components/ErrorBoundary.tsx
```

### Utilities
```
lib/canvas/index.ts
lib/canvas/parse.ts
lib/canvas/clipboard.ts
lib/feed/index.ts
lib/theme/index.ts
types/canvas.ts
```

---

## How I Work

- Using GitHub website to create files one at a time
- Each file gets exact path + complete code
- Submit code for AI review BEFORE creating on GitHub
- When chat corrupts code, verify on GitHub
- Local testing: `npm run dev` on home PC
- No Codespaces (monetization concerns)

---

## Known Issues

| Issue | Priority | Status |
|-------|----------|--------|
| `[key: string]: any` in CanvasElement | Low | Accepted |
| Mobile touch editing | Low | Deferred |
| DOMPurify not installed locally | High | Install pending |
| `mode` column not in local DB | High | Migration pending |

---

## Next Steps (When Home)

1. `git pull`
2. `npm install dompurify`
3. Database migration (mode column)
4. `npm run dev`
5. Full test checklist

---

## Testing Commands

```bash
npm run dev
npm run seed
npm run build
```

---

## Local Setup

- Home PC: `C:\Users\calve\Myah-Travels`
- Node.js v20.20.2
- Database: `data/site.db`
- Schema: `scripts/setup-local-db.js`
```

---

**Commit this. Then update TODO.md and CODE-PLAN.md the same way.**
