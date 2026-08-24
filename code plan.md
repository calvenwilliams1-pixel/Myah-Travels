# Updated CODE-PLAN.md

```
# Code Planning Phase - Segmentation Strategy

## Overview

All 17 original segments are COMPLETE. The Canvas Design System is in progress (Phases 1-6 done, Phase 7 next).

---

## File Combining Rules

### Rule 1: Utility Functions Combine
Related utility functions go in ONE file with an `index.ts` naming convention.

| Domain | Combined File |
|--------|---------------|
| Security | lib/security/index.ts |
| Auth | lib/auth/index.ts |
| Email | lib/email/index.ts |
| Email Templates | lib/email/templates.ts |
| Media | lib/media/index.ts |
| Settings | lib/settings/index.ts |
| Monitoring | lib/monitoring/index.ts |
| Search | lib/search/index.ts |
| Portal Lib | lib/portal/index.ts |
| Clients Lib | lib/clients/index.ts |
| Content Lib | lib/content/index.ts |
| Logging | lib/logging/index.ts |
| Jobs | lib/jobs/index.ts |
| Canvas | lib/canvas/index.ts |

### Rule 2: Next.js Routes Stay Separate
Files in `app/` stay separate (file-based routing).

### Rule 3: Database Schema Stays Separate
Files in `drizzle/schema/` stay separate (Drizzle convention).

### Rule 4: Shell Scripts Stay Separate
Files in `scripts/` stay separate.

### Rule 5: Canvas Element Views Stay Separate
Each element type has its own view file in `components/editor/canvas/elements/`.

---

## Original 17 Segments (COMPLETE)

| Segment | Files | Status |
|---------|-------|--------|
| 0: Project Init | 16 | ✅ |
| 1: Database | 33 | ✅ |
| 1.5: Security | 1 | ✅ |
| 2: Auth | 5 | ✅ |
| 13a: Logging | 1 | ✅ |
| 7: Email | 5 | ✅ |
| 14: Backup/Deploy | 8 | ✅ |
| 3: Content | 19 | ✅ |
| 4: Media | 4 | ✅ |
| 12: Settings | 3 | ✅ |
| 5: Clients | 7 | ✅ |
| 8: Search | 3 | ✅ |
| 10: Public Pages | 11 | ✅ |
| 11: Homepage | 13 | ✅ |
| 6: Portal | 9 | ✅ |
| 9: Dashboard | 8 | ✅ |
| 15: Testing | 7 | ✅ |

---

## Canvas Design System Phases

### Phase 1: Foundation (COMPLETE)
- types/canvas.ts
- drizzle/schema/assets.ts
- drizzle/schema/templates.ts
- drizzle/schema/portal-checklist-states.ts
- lib/canvas/index.ts
- components/editor/canvas/elements/TextElementView.tsx
- components/editor/canvas/elements/ImageElementView.tsx
- components/editor/canvas/CanvasEditor.tsx

### Phase 2: Moveable Integration (COMPLETE)
- components/editor/canvas/ElementCatalog.tsx
- CanvasEditor updated (resize, rotate, snap, group-drag)

### Phase 3: Properties Panel (COMPLETE)
- components/editor/canvas/PropertiesPanel.tsx
- components/editor/canvas/elements/ShapeElementView.tsx
- CanvasEditor updated (zIndex functions)

### Phase 4: Smart Blocks (COMPLETE)
- components/editor/canvas/elements/SmartBlockElementView.tsx
- CanvasEditor updated (list/checklist/proscons cases)

### Phase 5: Button + PDF (COMPLETE)
- components/editor/canvas/elements/ButtonElementView.tsx
- components/editor/canvas/elements/PdfElementView.tsx
- CanvasEditor updated (button/pdf cases)

### Phase 6: Layers Panel (COMPLETE)
- components/editor/canvas/LayersPanel.tsx
- CanvasEditor updated (visibility, lock, rename, selection)

### Phase 6.1: Polish (COMPLETE)
- Hidden + locked excluded from snap guidelines
- Properties toggle button
- Cached Moveable targets
- Legacy document compatibility (visible !== false, locked === true)

### Phase 7: Template System UI (NEXT)
- Template picker modal (choose starting template)
- Save as template button
- Template manager (list, delete, duplicate)
- API routes for template CRUD

### Phase 8: Draft + Schedule UI (PENDING)
- Draft badge/indicator
- Schedule date/time picker
- Publish button with options

### Phase 9: Server-side CanvasRenderer (PENDING)
- Public rendering of CanvasDocument JSON
- Mobile scaling CSS

### Phase 10: Portal Dynamic Elements (PENDING)
- Portal dates element
- Portal notices element
- Portal documents element
- Portal FAQs element
- Interactive portal checklists

### Phase 11: Homepage Canvas Editor (PENDING)
- Apply CanvasEditor to homepage
- Template system for homepage

### Phase 12: Canvas Block in TipTap (PENDING)
- Embed canvas-designed sections in blog posts

### Phase 13: Built-in Templates (PENDING)
- Seed 10+ starter templates
- Template thumbnails

### Phase 14: Testing + Polish (PENDING)
- End-to-end canvas testing
- Performance testing
- Mobile testing

---

## Canvas File Inventory

```
components/editor/canvas/
├── CanvasEditor.tsx
├── ElementCatalog.tsx
├── PropertiesPanel.tsx
├── LayersPanel.tsx
└── elements/
    ├── TextElementView.tsx
    ├── ImageElementView.tsx
    ├── ShapeElementView.tsx
    ├── SmartBlockElementView.tsx
    ├── ButtonElementView.tsx
    └── PdfElementView.tsx

types/
└── canvas.ts

lib/
└── canvas/
    └── index.ts

drizzle/schema/
├── assets.ts
├── templates.ts
└── portal-checklist-states.ts
```

---

## Progress Tracker

| Phase | Status | Files |
|-------|--------|-------|
| Original 17 Segments | ✅ Complete | ~170 |
| Canvas Phase 1 | ✅ Complete | 8 |
| Canvas Phase 2 | ✅ Complete | 1 |
| Canvas Phase 3 | ✅ Complete | 2 |
| Canvas Phase 4 | ✅ Complete | 1 |
| Canvas Phase 5 | ✅ Complete | 2 |
| Canvas Phase 6 | ✅ Complete | 1 |
| Canvas Phase 6.1 | ✅ Complete | 0 |
| Canvas Phase 7 | Not Started | 0/3 |
| Canvas Phases 8-14 | Not Started | 0/7 |

---

## Next Step

Phase 7: Template System UI
