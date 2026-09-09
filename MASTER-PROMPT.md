# Myah Travels - MASTER-PROMPT.md (Revised)

I am building a website called "MyCalTravels" for a travel writer/agent (Myah).

---

## Current Status

**Architecture: Content Blocks System with Template Creator + Theme System.**

The project has fully pivoted from Canvas/design tools to a block-based content system. The theme system is now semantic-token-driven, and the colour settings are simplified for professional use.

**Core principle: Developer controls design. Template controls layout. Writer controls content. Settings control brand.**

---

## The Pivot (Complete)

### Old Direction (Rejected)
- Canvas editor for writers
- Drag/resize/rotate elements
- Properties panels with colours/borders
- Freeform layout
- Moveable integration
- Full colour customisation (4 pickers)

### New Direction (Implemented)
- Block-based content (10 blocks: Title, Body, Callout, Hero, Image, Gallery, QuickFacts, Quote, ProsCons, Verdict)
- Templates define structure (Story, Travel Guide, Review)
- Writers fill content blocks
- No design decisions for writers
- Vertical block editor (Notion-style)
- Template Creator for admin
- Curated colour palettes (not free-form pickers)

---

## Architecture

### Block System
- `BlockType` = discriminated union of 10 content types
- `BLOCK_REGISTRY` maps type → editor + renderer
- One block type = one data model = one editor = one renderer
- `BlockEditor.tsx` = main vertical editor with live preview

### Template System
- Templates define which blocks are allowed + order
- `TemplateSection` has `label` + `state` (required/optional/disabled)
- Writer picks template, fills blocks
- `TemplateCreator.tsx` = admin UI for building templates
- `template-store.ts` = DB persistence (contentType: "post")

### Theme System
- Semantic tokens: primary, secondary, accent, success, warning, danger, info
- RGB CSS variables for opacity support
- ThemeProvider wraps both public + admin layouts
- Admin settings: Primary + Accent pickers only
- 6 curated palettes (Coastal, Desert, Alpine, Editorial, Tropical, Minimal)
- Secondary auto-derived from primary (subtle surfaces)
- Background fixed white (professional standard)

### Post Storage
- Post = templateId + ordered list of block instances
- Block instance = type + data (content only, NO x/y/width/height)

---

## MVP Phases

| Phase | Status | What |
|-------|--------|------|
| 1 | ✅ Complete | TypeScript interfaces + BlockRegistry + 10 blocks |
| 2 | ✅ Complete | Vertical block editor + template selector + live preview |
| 3 | ✅ Complete | 3 starter templates + PostRenderer + Template Creator |
| 4 | ⏳ Pending | Portal blocks + manual migration |

---

## Canvas System

**FROZEN. Not deleted. To be removed when block editor is fully approved.**

Keep for potential:
- Template previews (temporary)
- Reference for migration

No new Canvas features. Canvas colour migration deferred (39 emerald references remain in frozen files).

---

## Key Files (Current)

### Block System
- `types/blocks.ts` - Block types + TemplateSection + TemplateStyle
- `lib/blocks/registry.ts` - BLOCK_REGISTRY (10 blocks)
- `lib/blocks/templates.ts` - Starter templates (3)
- `lib/blocks/styles.ts` - Theme variants (minimal, travel, review)
- `lib/blocks/template-store.ts` - DB save/load
- `components/editor/blocks/BlockEditor.tsx` - Main editor
- `components/editor/blocks/TemplateCreator.tsx` - Admin template builder
- `components/editor/blocks/TemplatePreview.tsx` - Live preview
- `components/editor/renderers/PostRenderer.tsx` - Renders all 10 blocks
- `components/editor/renderers/*Renderer.tsx` - Individual renderers
- `components/editor/blocks/*BlockEditor.tsx` - Individual editors

### Theme System
- `components/theme/ThemeProvider.tsx` - CSS variables + RGB tokens
- `lib/theme/index.ts` - hexToRgb, darkenHex, validateHexColor
- `tailwind.config.js` - Semantic colour tokens
- `app/admin/(dashboard)/settings/PalettePicker.tsx` - Curated palettes
- `app/admin/(dashboard)/settings/page.tsx` - Admin settings

### Content
- `lib/content/index.ts` - Content CRUD + tag system
- `components/editor/TipTapEditor.tsx` - Rich text editor
- `components/editor/TagInput.tsx` - Tag input with auto-suggest
- `app/admin/(dashboard)/posts/` - Post management

---

## Known Issues

1. **better-sqlite3 crash in Codespace**: Native module crashes after multiple server-action saves (settings save). Environment-specific - won't occur on real deployment (mini PC). Workaround: restart dev server.

2. **Canvas system**: 39 hardcoded emerald references remain (frozen). To be deleted with Canvas system.

3. **Background colour**: Fixed white. Dark mode deferred indefinitely (reader preference feature, separate from branding).

---

## Testing Commands

```bash
npm run dev        # Dev server (crash after multiple saves - known issue)
npm run seed       # Recreate + seed database
npm run build      # Production build (passes cleanly)
npm start          # Production server
```

---

## Future Work (Prioritised)

### High Priority
- Preview popup feature (scoped: modal → floating → fullscreen)
- Target surface token conversion (20-30 selective instances)
- Delete Canvas system

### Medium Priority
- Auto Save (debounced)
- Undo/Redo
- Publish Validation
- Error Boundaries per block

### Low Priority
- Dark mode (reader preference only)
- Template versioning
- Additional block types

---

**Last Updated:** September 8, 2026
