# Myah Travels - MASTER-PROMPT.md

I am building a website called "Myah Travels" for a travel writer/agent.

---

## Current Status

**Major Architecture Pivot: Content Blocks System.**

After Myah's feedback, the project has shifted from Canvas/design tools to a block-based content system.

**Core principle: Developer controls design. Template controls layout. Writer controls content.**

---

## The Pivot

### Old Direction (Rejected)
- Canvas editor for writers
- Drag/resize/rotate elements
- Properties panels with colours/borders
- Freeform layout
- Moveable integration

### New Direction
- Block-based content (Title, Body, Hero, Gallery, Quote, etc)
- Templates define design (Story, Guide, Review, FAQ)
- Writers fill content blocks
- No design decisions for writers
- Vertical block editor (Notion-style)

---

## Architecture

### Block System
- `BlockType` = discriminated union of content types
- `BLOCK_REGISTRY` maps type → editor + renderer
- One block type = one data model = one editor = one renderer

### Template System
- Templates define which blocks are allowed + order
- Templates control all visual design
- Writer picks template, fills blocks

### Post Storage
- Post = templateId + ordered list of block instances
- Block instance = type + data (content only, NO x/y/width/height)

---

## MVP Phases

| Phase | What |
|-------|------|
| 1 | TypeScript interfaces + BlockRegistry + 3 blocks |
| 2 | Vertical block editor + template selector |
| 3 | 3 starter templates + PostRenderer |
| 4 | Portal blocks + manual migration |

---

## Canvas System

**FROZEN. Not deleted.**

Keep for potential:
- Template previews
- Admin tools
- Future landing pages

No new Canvas features.

---

## Key Files (Current)

- `types/canvas.ts` - Canvas types (frozen)
- `lib/content/index.ts` - Content CRUD + tag system
- `components/editor/TipTapEditor.tsx` - Rich text editor
- `components/editor/TagInput.tsx` - Tag input with auto-suggest
- `app/admin/(dashboard)/posts/` - Post management

---

## Testing Commands

npm run dev
npm run seed
npm run build
