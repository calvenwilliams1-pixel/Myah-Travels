# MASTER-PROMPT.md (Revised - Current State)

I am building a website called "Myah Travels" for a travel writer/agent. Here is the complete context:

---

## Current Status

**ALL CORE SEGMENTS AND CANVAS PHASES 1-15 COMPLETE. Phase 16 (Dual-Mode Editor) IN PROGRESS.**

~200 files created on GitHub. Local testing setup working on home PC.

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

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (types, schemas, element views) | ✅ |
| 2 | Moveable integration | ✅ |
| 3 | PropertiesPanel + ShapeElementView | ✅ |
| 4 | SmartBlockElementView | ✅ |
| 5 | ButtonElementView + PdfElementView | ✅ |
| 6 | LayersPanel | ✅ |
| 6.1 | Polish | ✅ |
| 7 | Template System | ✅ |
| 7.1 | Template polish | ✅ |
| 8 | PublishControls | ✅ |
| 9 | CanvasRenderer | ✅ |
| 10 | Portal Dynamic Elements | ✅ |
| 10.1 | Portal PropertiesPanel | ✅ |
| 11 | Homepage Canvas Editor | ✅ |
| 12 | Canvas Block in TipTap | ✅ |
| 13 | Built-in Templates (11) | ✅ |
| 14 | Testing + Polish | ✅ |
| 15 | Feed System + Theme System | ✅ |
| 15a-15n | Pin/Highlight, admin, password | ✅ |

### Phase 16: Dual-Mode Editor - IN PROGRESS

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
| P1-3: Triangle shape | ❌ Pending |
| P1-4: Right-click context menu | ❌ Pending |
| P1-5: Cross-post copy/paste | ❌ Pending |
| P2-1: Per-element undo/redo | ❌ Deferred |
| P2-2: Mobile touch editing | ❌ Deferred |
| P2-3: Story mode canvas full editor | ❌ Deferred |

---

## Key Architecture Decisions

| Decision | Choice |
|----------|--------|
| Position/size | Pixel-based at 800px design width |
| Responsive | `transform: scale()` CSS |
| Mode | `story` or `design`, locked at creation |
| Storage | SQLite with JSON blobs |
| Undo/redo | Global (capped 50) |
| Autosave | 2s debounce |
| Rich text | TipTap JSON in `richText` field |
| Grouping | `groupId` on elements |
| Templates | Snapshot at save time |
| Magic links | 7 days expiry, 2-step flow |
| Admin auth | Lucia + TOTP + password change |

---

## Files Created (Current Inventory)

### Canvas System
```
components/editor/canvas/
├── CanvasEditor.tsx (grouping, marquee, rich text)
├── CanvasRenderer.tsx (rich text, all elements)
├── CanvasScaler.tsx
├── MarqueeSelection.tsx
├── MiniCanvasEditor.tsx
├── ImageCropOverlay.tsx
├── ElementCatalog.tsx
├── PropertiesPanel.tsx (ColorPicker, portal props)
├── LayersPanel.tsx
├── TemplateManager.tsx
├── SaveTemplateModal.tsx
├── PublishControls.tsx
└── elements/
    ├── TextElementView.tsx (TipTap rich text)
    ├── TextFormatToolbar.tsx
    ├── ImageElementView.tsx (crop)
    ├── ShapeElementView.tsx
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

### Theme + Admin
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
lib/feed/index.ts
lib/theme/index.ts
types/canvas.ts
```

---

## How I Work

- Using GitHub website to create files one at a time
- Each file gets exact path + complete code
- Submit code for AI review BEFORE creating on GitHub
- When chat corrupts code, work directly in local files
- Local testing: `npm run dev` on home PC
- No Codespaces (monetization concerns)

---

## Known Issues

| Issue | Priority | Status |
|-------|----------|--------|
| `[key: string]: any` in CanvasElement | Low | Accepted tech debt |
| Per-element undo not built | Low | Deferred |
| Mobile touch editing | Low | Deferred |
| Cross-post copy/paste | Medium | P1-5 pending |
| URL strings corrupted in AI chat | N/A | Paste-only issue |

---

## Next Steps

1. P1-3: Triangle shape
2. P1-4: Right-click context menu
3. P1-5: Cross-post copy/paste
4. Local testing of all P0+P1
5. Database migration for mode field
6. Phase 17: Full testing + polish

---

## Testing Commands

```bash
npm run dev
npm run seed
npm run build
```

---

## Local Setup

Home PC has:
- Node.js v20.20.2
- Git
- Repo at `C:\Users\calve\Myah-Travels`
- Database at `data/site.db`
- Schema at `scripts/setup-local-db.js`
