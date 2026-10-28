# Batch H — Gallery Collage (Plan)

**Status:** Proposed. Awaiting review before any code.
**Split:** H1 (renderer + data, ~5h) then H2 (editor UX, ~8h). H1 reviewed and merged before H2 begins.
**Guardrail:** amended — see "Gallery Block Layout Presets (Batch H)" in `docs/MASTER-PROMPT.md`. Writer picks from curated layout presets per gallery; freeform positioning remains rejected.

---

## 1. Problem

The Gallery block is meant to be a collage with configurable layout. Current state:

- **Data** (`types/blocks.ts`): `GalleryData = { images: { url, caption }[] }`. No layout fields.
- **Editor** (`GalleryBlockEditor.tsx`): vertical list of individual `ImageSourcePicker` slots + per-image caption input + `+ Add Image` button. One image at a time, no bulk upload, no reorder. Batch A swapped the input component but did not add bulk upload or arrangement.
- **Renderer** (`GalleryRenderer.tsx`): hardcoded grid — column count derived from `images.length` (1 -> 1fr, 2 -> 2 cols, 3+ -> auto-fill minmax(150px,1fr)), fixed height from `style.galleryImageHeight`, no layout choice, no lightbox.

Result: every gallery looks the same. Myah has no way to say "3-column masonry" vs "2x2 grid" vs "horizontal scroll." Bulk-adding 10 photos means 10 separate dialogs.

## 2. Goal

- Multiple layout styles selectable per gallery from a curated preset set
- Bulk upload (multi-file select + drag-drop) in the editor
- Drag reorder on thumbnails
- Client-side lightbox on click
- Print-safe for every layout
- Keep per-image replace/caption path intact

## 3. Layout Presets

All fields optional on `GalleryData`. Absent -> default. Existing galleries with no layout fields render as current behavior.

### 3.1 Style

| Style | Description | Use case |
|-------|-------------|----------|
| `grid` | Uniform cells, all images same aspect | Standard gallery |
| `masonry` | Variable height, packed columns (CSS columns, top-to-bottom flow) | Mixed portrait/landscape photos |
| `carousel` | Horizontal scroll, snap-to-item | Many images, narrow space |
| `hero-then-grid` | First image full-width, rest in grid | Lead image + supporting |

Default: `grid`.

### 3.2 Columns

`2` | `3` | `4`. Applies to `grid` and `masonry`. Default: `3`. On mobile (<= 640px), `grid` and `masonry` collapse to 2 columns for 3/4, 1 column for 2. `carousel` always scrolls horizontally.

### 3.3 Aspect

`square` (1:1) | `portrait` (3:4) | `landscape` (4:3) | `auto` (natural). Applies to `grid` and `hero-then-grid`. `masonry` uses natural aspect. Default: `landscape`.

### 3.4 Gap

`small` (8px) | `medium` (16px) | `large` (24px). Default: `medium`.

### 3.5 Caption Display

`below` | `overlay` | `hidden`. Default: `below`. `hidden` still uses caption as `alt` (semantically visible).

## 4. Data Model
```ts

export type GalleryStyle = "grid" | "masonry" | "carousel" | "hero-then-grid";
export type GalleryColumns = 2 | 3 | 4;
export type GalleryAspect = "square" | "portrait" | "landscape" | "auto";
export type GalleryGap = "small" | "medium" | "large";
export type GalleryCaptionDisplay = "below" | "overlay" | "hidden";

export interface GalleryData {
  images: { url: string; caption: string }[];
  style?: GalleryStyle;
  columns?: GalleryColumns;
  aspect?: GalleryAspect;
  gap?: GalleryGap;
  captionDisplay?: GalleryCaptionDisplay;
}

```
All fields optional. No migration needed — new fields default at render time. `TemplateStyle.galleryImageHeight` becomes unused after H1 but is left in place (other code may reference the shape).

## 5. Editor UX (H2)

### 5.1 Structure

The gallery editor gains a layout controls header, a bulk upload zone, a thumbnail strip, and per-image detail sections below.

### 5.2 Bulk Upload Zone

- Dashed border, "Drop images or click to browse"
- `<input type="file" multiple accept="image/*">`
- Drag-over highlight
- Client-side file size check before POST (inherit /api/upload limit, per-file)
- Progress: "Uploading 3 of 7..."
- Partial failures listed below the zone
- Success -> append to `images[]` in insertion order, single onChange call

### 5.3 Thumbnail Strip

- Horizontal row of 60x60 thumbnails
- Drag handle on each (HTML5 drag, same pattern as PortalItemsList)
- Drop between thumbnails reorders
- Up/down arrows always visible (mobile has no hover)
- Click thumbnail -> expands per-image detail below
- Remove button on hover
- Drag disabled during in-flight upload

### 5.4 Per-image Detail

- Collapsible (collapsed by default, expands on thumbnail click)
- `ImageSourcePicker` for replace
- Caption input
- Delete

### 5.5 Live Preview

Layout controls take effect immediately in the preview pane / popup. No apply button.

## 6. Renderer Behavior (H1)

### 6.1 Grid

`display: grid; grid-template-columns: repeat(columns, 1fr); gap: gap;` Each cell: `aspect-ratio` from aspect field, `object-fit: cover`.

Mobile: at <= 640px, collapse to 2 columns for 3/4, 1fr for 2.

### 6.2 Masonry

CSS `columns: N`. Each image `break-inside: avoid`, natural aspect. No aspect override. **Trade-off documented:** flow is top-to-bottom within each column, not left-to-right rows. Standard editorial masonry. Zero-dependency, print-safe.

Mobile: collapse to 2 columns.

### 6.3 Carousel

`display: flex; overflow-x: auto; scroll-snap-type: x mandatory;` Each image `scroll-snap-align: start`, width 80% on mobile, 50% on desktop. Arrows always visible on mobile, hover-only on desktop. Keyboard accessible (left/right arrows).

### 6.4 Hero-then-grid

First image full-width, height `min(60vh, 500px)`, natural aspect. Remaining images in grid with `columns` and `aspect`. First image always uses auto aspect (forcing an aspect loses impact).

### 6.5 Lightbox

`<dialog>` element with `showModal()` — native focus trap, native Esc. Full-screen overlay with large image, caption below, prev/next arrows, close button. Keyboard: arrow keys navigate, Esc closes.

### 6.6 Caption Display

- `below`: `<figcaption>` under image (current behavior)
- `overlay`: text over image bottom with gradient scrim
- `hidden`: no caption rendered on screen; caption still used as alt text

### 6.7 Print

- Grid/masonry/hero-then-grid: `break-inside: avoid` per figure
- Carousel: rendered as grid in print (no horizontal scroll on paper)
- Lightbox: never rendered in print
- Captions always visible in print (even when hidden on screen)

## 7. Guardrails (Still Rejected)

- Freeform image positioning (drag-anywhere)
- Arbitrary column counts (5, 6, 7...)
- Per-image custom aspect ratios beyond the four presets
- Per-image size overrides
- Animated transitions between carousel slides
- Video in gallery (separate block type)
- Client-side image compression/cropping
- Cross-gallery linking or tags

## 8. Files Touched

**H1 (this batch):**
- `types/blocks.ts` — GalleryData extension + 5 type unions
- `components/editor/renderers/GalleryRenderer.tsx` — full rewrite (~200 lines)
- `docs/TESTING.md` — Batch H1 section

**H2 (after H1 review):**
- `components/editor/blocks/GalleryBlockEditor.tsx` — full rewrite (~250 lines)
- `docs/TESTING.md` — Batch H2 section

**Not touched:**
- `ImageSourcePicker.tsx` — bulk upload gets its own handler, does not reuse
- `PostRenderer.tsx` / `BlockEditor.tsx` — outer shell unchanged
- DB schema — no change, `GalleryData` is content JSON
- `TemplateStyle` — shape unchanged; `galleryImageHeight` becomes unused but stays

## 9. Build Plan

### H1 (this batch)

1. `types/blocks.ts` — type unions + 5 optional GalleryData fields
2. `GalleryRenderer.tsx` — 4 styles, `<dialog>` lightbox, print rules, defaults
3. `docs/TESTING.md` — Batch H1 section
4. Verify: `npm test` >= 135 passing, `tsc` clean, existing galleries render identically
5. Commit + push

### H2 (after H1 review)

1. `GalleryBlockEditor.tsx` — bulk upload zone, thumbnail strip + drag, layout controls, per-image detail collapse
2. `docs/TESTING.md` — Batch H2 section
3. Browser end-to-end verification
4. Commit + push

## 10. Test Plan

### H1 — Renderer

- Gallery with no layout fields -> grid, 3 columns, landscape, medium gap, captions below (defaults)
- `style: "grid"`, `columns: 4` -> 4-column grid
- `style: "masonry"`, `columns: 3` -> CSS columns, natural aspect preserved
- `style: "carousel"` -> horizontal scroll, snap
- `style: "hero-then-grid"` -> first image full-width, rest in grid
- `aspect: "square"` -> 1:1 cells
- `captionDisplay: "overlay"` -> gradient scrim, caption over image
- `captionDisplay: "hidden"` -> no caption on screen, alt still set from caption
- Click image -> lightbox opens
- Lightbox prev/next navigates
- Esc closes lightbox
- Print preview: carousel becomes grid, break-inside avoid per figure, lightbox not printed, captions visible
- Existing gallery with no layout fields renders identically to pre-H1

### H2 — Editor (after H1 merged)

- Layout controls at top of gallery editor, change each -> preview updates
- Bulk upload: drop 5 files -> all 5 appear as thumbnails
- Bulk upload partial failure: drop 3, 1 bad -> 2 succeed, 1 listed as failure
- Client-side file size check rejects oversized file before POST
- Thumbnail drag: drag thumbnail 3 before thumbnail 1 -> order persists on save/reload
- Thumbnail arrows: click up on thumbnail 2 -> moves to index 1
- Click thumbnail -> per-image detail expands
- Remove via thumbnail X -> image gone
- Replace via ImageSourcePicker in detail -> thumbnail updates
- Caption edit in detail -> thumbnail + preview update
- Save post -> reload -> all layout settings persist
- Existing gallery with no layout fields opens -> defaults shown, all controls usable
- Drag disabled during in-flight upload

## 11. Estimated Effort

| Piece | Hours |
|-------|-------|
| H1: type extension | 0.5 |
| H1: renderer per-style + lightbox + print | 4 |
| H1: tests + TESTING.md | 0.5 |
| **H1 total** | **5** |
| H2: bulk upload zone | 2 |
| H2: thumbnail strip + drag | 3 |
| H2: layout controls header | 1 |
| H2: per-image detail collapse | 1 |
| H2: tests + TESTING.md | 1 |
| **H2 total** | **8** |
| **Grand total** | **13** |

## 12. Questions for Reviewer

1. `<dialog>` vs portal-based modal for lightbox? Recommendation: `<dialog>` (native focus trap + Esc).
2. Carousel arrows: always visible or hover-only? Recommendation: always visible on mobile, hover-only on desktop.
3. `hero-then-grid`: first image aspect control? Recommendation: always auto (natural).
4. Bulk upload size limit: inherit `/api/upload` per-file, no batch cap? Confirmed.
5. Reorder during in-flight upload: disable drag? Recommendation: yes, disable.
6. `captionDisplay: "hidden"` — allow hiding while keeping caption as alt? Recommendation: yes, allow.
7. Masonry top-to-bottom flow acceptable? Recommendation: yes, documented trade-off.

## 13. Scope Boundaries

Explicitly excluded: see Section 7.
