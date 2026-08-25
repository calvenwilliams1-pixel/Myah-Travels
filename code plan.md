## Update CODE-PLAN.md

**Do this one thing:**
Click the pencil icon on `CODE-PLAN.md`

**Replace the entire file with:**

```markdown
# Myah Travels - CODE-PLAN.md (Current)

## Overview

All 17 original segments COMPLETE. Canvas Design System Phases 1-15 COMPLETE. Phase 16 (Dual-Mode Editor) COMPLETE. Testing pending.

---

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS, Lucia Auth, TipTap, react-moveable, DOMPurify

---

## Completion Status

### Original 17 Segments - ✅ COMPLETE

### Canvas Design System - ✅ Phases 1-15 COMPLETE

### Phase 16: Dual-Mode Editor - ✅ COMPLETE

| Priority | Items | Status |
|----------|-------|--------|
| P0 | Mode selection, responsive scale, editable canvas, grouping, marquee, color picker, image crop, button new tab | ✅ |
| P1 | Rich text in canvas, toolbar, triangle, context menu, cross-post copy/paste | ✅ |
| P2-3 | Story canvas full editor | ✅ |
| P2-1 | Per-element undo | Skipped |
| P2-2 | Mobile touch | Deferred |

---

## Key Files

### Canvas System
```
components/editor/canvas/
├── CanvasEditor.tsx (grouping, marquee, rich text)
├── CanvasRenderer.tsx (all elements, DOMPurify)
├── CanvasScaler.tsx (responsive scale)
├── MarqueeSelection.tsx
├── MiniCanvasEditor.tsx (basic)
├── MiniCanvasEditorFull.tsx (full editing)
├── ImageCropOverlay.tsx
├── ElementCatalog.tsx
├── PropertiesPanel.tsx (ColorPicker, portal props)
├── LayersPanel.tsx
├── TemplateManager.tsx
├── SaveTemplateModal.tsx
├── PublishControls.tsx
├── ContextMenu.tsx
└── elements/ (11 files)
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

### Feed + Theme
```
components/feed/ (6 files)
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

## Architecture Decisions

| Decision | Choice |
|----------|--------|
| Position | Pixel-based at 800px |
| Responsive | `transform: scale()` |
| Mode | Locked at creation |
| Storage | SQLite JSON blobs |
| Undo/redo | Global (capped 50) |
| Autosave | 2s debounce |
| Rich text | TipTap JSON |
| Grouping | groupId |
| Clipboard | localStorage |

---

## Next Steps

1. Home: git pull
2. Home: npm install dompurify
3. Home: database migration
4. Home: test everything
5. Phase 17: Fix bugs found in testing
```

---

**Commit this.**

---

## All Documentation Updated

| File | Status |
|------|--------|
| MASTER-PROMPT.md | ✅ |
| TODO.md | ✅ |
| CODE-PLAN.md | ✅ |

---

**All code and docs are current. Next: home testing.**
