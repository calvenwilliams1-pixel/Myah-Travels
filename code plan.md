# Updated CODE-PLAN.md

```
# Myah Travels - Code Planning Document (Current)

## Overview

All 17 original segments COMPLETE. Canvas Design System Phases 1-15 COMPLETE. Phase 16 (Dual-Mode Editor) IN PROGRESS.

---

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS, Lucia Auth, TipTap, react-moveable, Resend email

---

## File Combining Rules

| Rule | Description |
|------|-------------|
| Rule 1 | Utility functions combined in `lib/[domain]/index.ts` |
| Rule 2 | Next.js routes stay separate (`app/` file-based routing) |
| Rule 3 | Database schemas stay separate (`drizzle/schema/`) |
| Rule 4 | Shell scripts stay separate (`scripts/`) |
| Rule 5 | Canvas element views stay separate (`components/editor/canvas/elements/`) |

---

## Completion Status

### Original 17 Segments - ✅ COMPLETE (~170 files)

All core application functionality built and tested.

### Canvas Design System - ✅ Phases 1-15 COMPLETE

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (types, schemas, element views) | ✅ |
| 2 | Moveable integration (drag/resize/rotate/snap) | ✅ |
| 3 | PropertiesPanel + ShapeElementView | ✅ |
| 4 | SmartBlockElementView (lists/checklists/proscons) | ✅ |
| 5 | ButtonElementView + PdfElementView | ✅ |
| 6 | LayersPanel (visibility, lock, rename) | ✅ |
| 6.1 | Polish (snap exclusions, undo toast) | ✅ |
| 7 | Template System (picker, manager, save) | ✅ |
| 7.1 | Template polish (save indicator, lock badges) | ✅ |
| 8 | PublishControls (draft/schedule/publish) | ✅ |
| 9 | CanvasRenderer (public rendering) | ✅ |
| 10 | Portal Dynamic Elements | ✅ |
| 10.1 | Portal PropertiesPanel editing | ✅ |
| 11 | Homepage Canvas Editor | ✅ |
| 12 | Canvas Block in TipTap | ✅ |
| 13 | Built-in Templates (11 seeded) | ✅ |
| 14 | Testing + Polish | ✅ |
| 15 | Feed System + Theme System | ✅ |
| 15a-15n | Pin/Highlight, admin controls, password change | ✅ |

### Phase 16: Dual-Mode Editor - IN PROGRESS

| Sub-phase | Description | Status |
|-----------|-------------|--------|
| P0 | Blocking features | ✅ COMPLETE |
| P0-1 | Mode selection UI (story/design) | ✅ |
| P0-2 | Canvas responsive scale | ✅ |
| P0-3 | Editable canvas windows in TipTap | ✅ |
| P0-4 | Grouping (groupId wired up) | ✅ |
| P0-5 | Marquee selection | ✅ |
| P0-6 | Full hex color picker | ✅ |
| P0-7 | Image crop/reposition | ✅ |
| P0-8 | Button "open in new tab" toggle | ✅ |
| P1 | Should ship soon | PARTIAL |
| P1-1 | Rich text in canvas text elements | ✅ |
| P1-2 | Text formatting toolbar | ✅ |
| P1-3 | Triangle shape | ❌ PENDING |
| P1-4 | Right-click context menu | ❌ PENDING |
| P1-5 | Cross-post copy/paste | ❌ PENDING |
| P2 | Deferred | NOT STARTED |
| P2-1 | Per-element undo/redo | ❌ |
| P2-2 | Mobile touch editing | ❌ |
| P2-3 | Story mode canvas full editor | ❌ |

---

## Current File Inventory

### Canvas System Files

```
components/editor/canvas/
├── CanvasEditor.tsx
├── CanvasRenderer.tsx
├── CanvasScaler.tsx
├── MarqueeSelection.tsx
├── MiniCanvasEditor.tsx
├── ImageCropOverlay.tsx
├── ElementCatalog.tsx
├── PropertiesPanel.tsx
├── LayersPanel.tsx
├── TemplateManager.tsx
├── SaveTemplateModal.tsx
├── PublishControls.tsx
├── ContextMenu.tsx (P1-4)
└── elements/
    ├── TextElementView.tsx (rich text)
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

components/editor/
├── TipTapEditor.tsx
├── TipTapRenderer.tsx
├── Toolbar.tsx
├── CanvasBlockNode.tsx
├── CanvasBlockComponent.tsx
├── CanvasBlockRenderer.tsx
├── InsertCanvasBlockButton.tsx
└── ModeSelectorModal.tsx

components/feed/
├── FeedCard.tsx
├── FeedContainer.tsx
├── FeedFilters.tsx
├── FeedPage.tsx
├── InfiniteFeed.tsx
├── types.ts

components/theme/
├── ThemeProvider.tsx

components/admin/
├── FeedAdminControls.tsx

components/ui/
├── ColorPicker.tsx

components/
├── ErrorBoundary.tsx

lib/
├── canvas/
│   ├── index.ts
│   └── parse.ts
├── feed/
│   └── index.ts
└── theme/
    └── index.ts

types/
└── canvas.ts

drizzle/schema/
├── posts.ts (mode field)
├── guides.ts (mode field)
├── reviews.ts (mode field)
├── templates.ts (slug field)
├── assets.ts
├── portal-checklist-states.ts
└── (all original schemas)
```

---

## Key Architecture Decisions

| Decision | Choice |
|----------|--------|
| Position/size | Pixel-based at fixed design width (800px) |
| Responsive | `transform: scale()` on canvas container |
| Mode | `story` or `design`, locked at creation |
| Storage | SQLite with JSON blobs for canvas content |
| Undo/redo | Global (capped 50), not per-element |
| Autosave | 2s debounce |
| Rich text | TipTap JSON stored in `richText` field |
| Grouping | `groupId` on elements (no separate group object) |
| Templates | Snapshot at save time, fully independent |
| Copy/paste | Within same editor (cross-post in P1-5) |

---

## Recent Changes (Phase 15-16)

### Phase 15: Feed System + Theme
- Facebook-style feed on homepage
- Pin/highlight posts
- Endless scroll
- Theme system (colors, background image, transparency)
- Password change with brute force protection

### Phase 16 P0: Dual-Mode Editor
- Mode selection modal (Story vs Design)
- Canvas responsive scaling
- Editable canvas windows in TipTap
- Grouping + ungrouping
- Marquee selection
- Full hex color picker
- Image crop/reposition
- Button open-in-new-tab

### Phase 16 P1 (Partial):
- Rich text (TipTap) in canvas text elements
- Text formatting toolbar in canvas

---

## Known Issues

| Issue | Priority | Status |
|-------|----------|--------|
| URL strings corrupted in AI chat pastes | N/A | Paste-only issue |
| `[key: string]: any` in CanvasElement | Low | Accepted technical debt |
| Per-element undo not implemented | Low | Deferred to P2 |
| Mobile touch editing not implemented | Low | Deferred to P2 |
| Cross-post copy/paste | Medium | P1-5 pending |

---

## Next Steps (In Order)

1. P1-3: Triangle shape
2. P1-4: Right-click context menu
3. P1-5: Cross-post copy/paste
4. Local testing of all P0 + P1 features
5. Database migration for mode field
6. Phase 17: Testing + Polish

---

## Testing Commands

```bash
npm run dev
npm run seed
npm run build
```
```

---

**This is the current state. Save this as CODE-PLAN.md.**
