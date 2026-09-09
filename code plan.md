# MyCalTravels - CODE-PLAN.md (Revised)

## Overview

Block System (10 blocks) COMPLETE. Template Creator COMPLETE. Theme System COMPLETE. Canvas system FROZEN (pending deletion). All build errors fixed. Production build passes cleanly.

## Tech Stack

Next.js 14 App Router, TypeScript, SQLite (better-sqlite3), Drizzle ORM, Tailwind CSS, Lucia Auth, TipTap, react-moveable 0.56.0, DOMPurify

---

## Current Architecture

### Block System (ACTIVE)
```
types/blocks.ts              # BlockType union, TemplateSection, TemplateStyle
lib/blocks/registry.ts       # BLOCK_REGISTRY (10 blocks)
lib/blocks/templates.ts      # Starter templates (Story, Travel Guide, Review)
lib/blocks/styles.ts         # Theme variants (minimal, travel, review)
lib/blocks/template-store.ts # DB save/load
lib/blocks/index.ts          # Exports

components/editor/blocks/
├── BlockEditor.tsx          # Main vertical editor (10 blocks wired)
├── TitleBlockEditor.tsx
├── BodyBlockEditor.tsx
├── CalloutBlockEditor.tsx
├── HeroBlockEditor.tsx
├── ImageBlockEditor.tsx
├── GalleryBlockEditor.tsx
├── QuickFactsBlockEditor.tsx
├── QuoteBlockEditor.tsx
├── ProsConsBlockEditor.tsx
├── VerdictBlockEditor.tsx
├── TemplatePreview.tsx      # Live preview (sticky on desktop)
└── TemplateCreator.tsx      # Admin template builder

components/editor/renderers/
├── PostRenderer.tsx         # Switch on 10 block types
├── TitleRenderer.tsx
├── BodyRenderer.tsx
├── CalloutRenderer.tsx
├── HeroRenderer.tsx
├── ImageRenderer.tsx
├── GalleryRenderer.tsx
├── QuickFactsRenderer.tsx
├── QuoteRenderer.tsx
├── ProsConsRenderer.tsx
├── VerdictRenderer.tsx
└── CleanTipTapRenderer.tsx
```

### Theme System (ACTIVE)
```
components/theme/ThemeProvider.tsx    # CSS variables + RGB tokens
lib/theme/index.ts                    # hexToRgb, darkenHex, validateHexColor
tailwind.config.js                    # Semantic tokens (primary, secondary, accent, success, warning, danger, info)
app/admin/(dashboard)/settings/
├── page.tsx                          # Primary + Accent pickers only
└── PalettePicker.tsx                 # 6 curated palettes (client component)
```

### Canvas System (FROZEN - To Be Deleted)
```
components/editor/canvas/     # 39 hardcoded emerald remain (not migrated)
components/editor/CanvasBlockNode.tsx
components/editor/CanvasBlockComponent.tsx
components/editor/CanvasBlockRenderer.tsx
```

---

## Database Schema (drizzle/schema/)

All 35 tables defined. Key tables:
- `posts`, `guides`, `reviews` - content (with `mode`, `isPinned`, `isHighlighted`)
- `templates` - stores Canvas + block templates (`content_type` distinguishes)
- `settings` - key-value site settings
- `tags` - with `is_favourite`, `last_used_at`
- `sessions` - Lucia auth sessions

**Note:** `schema.sql` is outdated (missing `is_favourite` on tags, `expires_at` on guides). Use Drizzle schema + seed for fresh installs.

---

## Known Issues

1. **better-sqlite3 crash in Codespace**: Crashes after multiple server-action saves (native binding cleanup bug with Node 24). Environment-specific. Won't occur on mini PC deployment.

2. **Canvas system**: 39 emerald references remain (frozen). Delete when block editor approved.

3. **schema.sql outdated**: Missing columns added by Drizzle migrations. Use `npm run seed` for fresh DB.

---

## Remaining Work

### High Priority
- Preview popup (modal → floating → fullscreen)
- Target surface token conversion (~20-30 `bg-gray-50/100` → theme-derived)
- Delete Canvas system

### Medium Priority
- Auto Save (debounced)
- Undo/Redo
- Publish Validation
- Error Boundaries per block

### Low Priority
- Dark mode (reader preference)
- Template versioning
- Additional block types

---

## Testing Setup

```bash
npm run dev        # Dev server (crashes after multiple saves - known)
npm run seed       # Recreate + seed database
npm run build      # Production build (passes)
npm start          # Production server
```

**Note:** `.env` needs `RESEND_API_KEY=re_dummy_key_for_dev` for admin pages to load.

---

**Last Updated:** September 8, 2026
