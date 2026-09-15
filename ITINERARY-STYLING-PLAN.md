# Itinerary Styling — Final Implementation Plan (7.6.9)

**Status:** Approved roadmap for implementation
**Supersedes:** All prior 7.6.9 design discussions

## 1. Product Summary

Give Myah personal flair and ownership over itineraries while keeping the platform automated-first and low-maintenance.

The platform:
- Looks good by default — zero styling work required
- Requires little or no styling work
- Allows optional customization when desired
- Reuses existing theme/palette systems
- Is not a design tool or Canva replacement

**Design spine:** one colour system, three inheritance levels, two override points, zero freeform.

## 2. User Experience Flow

### Default (no styling work)
1. Myah creates an itinerary. It inherits the site theme.
2. She adds sections, days, segments.
3. Everything renders beautifully. She is done.

### Optional itinerary-level theme (the primary styling workflow)
1. Myah opens the itinerary editor.
2. At the top: **Theme: [Inherit site default ▾]** — dropdown of the 6 existing palettes + Inherit.
3. She picks "Tropical". Every section, day, segment, stay inherits Tropical.
4. Done.

### Optional section-level override
1. In a specific section (e.g., "Cruise"), she sees **Theme: [Inherit itinerary ▾]**.
2. She picks "Coastal".
3. That section renders in Coastal; everything else stays Tropical.

### Optional graphic block
1. Within any day, Myah clicks **+ Add Block** at one of the slot anchors:
   - Before day
   - After morning
   - After afternoon
   - After evening
2. She picks: Image / Callout / Notice.
3. For Image: Upload / Paste URL / From Library (existing `ImageSourcePicker`).
4. For Callout/Notice: text + variant (tip / warning / info).
5. Size: Small / Medium / Full-width.
6. Optional palette override on the block itself (deliberate visual element).
7. Saves. Block renders in the chosen slot.

### Highlight a segment
1. In the segment editor, one checkbox: **Highlight this segment**.
2. When enabled, the segment card uses the resolved theme's accent colour — no colour decision required.

## 3. Styling Architecture

### Three inheritance levels

    Site default (admin settings)
      └─ Itinerary theme_preset
           └─ Section theme_preset_override
                └─ Block palette_override (graphic blocks only)

Resolution order at render:
1. Section override (if set)
2. Itinerary theme (if set)
3. Site default (fallback)

Content segments do NOT participate in this hierarchy at the segment level. They inherit from section/day and apply their type-based styling on top.

### Single source of truth

Palettes currently live as a local constant inside `components/admin/settings/PalettePicker.tsx`. Extract to `lib/theme/palettes.ts`:

    export interface Palette { name: string; primary: string; accent: string; }
    export const PALETTES: Palette[] = [
      { name: "Coastal", primary: "#0077B6", accent: "#FFB703" },
      { name: "Desert", primary: "#8B5E3C", accent: "#FF7043" },
      { name: "Alpine", primary: "#1B4332", accent: "#4CAF50" },
      { name: "Editorial", primary: "#1D3557", accent: "#E63946" },
      { name: "Tropical", primary: "#00897B", accent: "#FF6F61" },
      { name: "Minimal", primary: "#374151", accent: "#2563EB" },
    ];
    export function getPalette(name: string | null | undefined): Palette | null;

`PalettePicker.tsx` imports from here. Itinerary theme picker imports from here. One list, two consumers.

### Rendering

Renderers receive a resolved palette via a small context or prop:

    interface ResolvedTheme {
      primary: string;
      accent: string;
      source: "site" | "itinerary" | "section" | "block";
    }

The itinerary client view is wrapped in a `data-theme-primary="..."` and `data-theme-accent="..."` on the section wrapper. Segment cards and block cards style off those via inline styles (not global CSS vars, since a page can have multiple sections with different themes side by side).

## 4. Inheritance Rules

| Element | Inherits from | May override | Override column |
|---------|--------------|--------------|-----------------|
| Itinerary | Site default | Yes | `itineraries.theme_preset` |
| Section | Itinerary | Yes | `itinerary_sections.theme_preset_override` |
| Day | Section | No | — |
| Segment (activity/travel/meal/free_day) | Section | No (highlight flag only) | `itinerary_segments.is_highlighted` |
| Stay | Section | No | — |
| Graphic block (image/callout/notice) | Section | Yes | `itinerary_blocks.palette_override` |

**Explicitly forbidden:**
- A segment overriding the section palette
- A day overriding the section palette
- A stay overriding the section palette

## 5. Schema Changes

### `itineraries`
Add:
- `theme_preset TEXT` — one of the palette names, or NULL for inherit-site

### `itinerary_sections`
Add:
- `theme_preset_override TEXT` — one of the palette names, or NULL for inherit-itinerary

### `itinerary_segments`
Add:
- `is_highlighted INTEGER DEFAULT 0`

### New table: `itinerary_blocks`

    id                  INTEGER PK
    itinerary_id        INTEGER NOT NULL FK -> itineraries(id) ON DELETE CASCADE
    section_id          INTEGER NULL FK -> itinerary_sections(id) ON DELETE CASCADE
    day_id              INTEGER NULL FK -> itinerary_days(id) ON DELETE CASCADE
    block_type          TEXT NOT NULL            -- "image" | "callout" | "notice"
    slot                TEXT NOT NULL            -- "before-day" | "after-morning" | "after-afternoon" | "after-evening"
    position            INTEGER DEFAULT 0        -- secondary sort within same slot
    image_url           TEXT NULL
    image_alt           TEXT NULL
    text_content        TEXT NULL
    variant             TEXT NULL                -- for callout/notice: "tip" | "warning" | "info"
    size                TEXT NOT NULL DEFAULT 'medium'   -- "small" | "medium" | "full"
    palette_override    TEXT NULL                -- one of the palette names, or NULL for inherit
    created_at          TEXT DEFAULT CURRENT_TIMESTAMP

    CHECK (section_id IS NOT NULL OR day_id IS NOT NULL)
    CHECK (NOT (section_id IS NOT NULL AND day_id IS NOT NULL))

**Why `itinerary_id` on the block, even though it also has section/day:** denormalised for ownership validation (see §10). The block's true parent is section or day; the itinerary_id is a shortcut for "does this user own the itinerary this block belongs to."

Add indexes:
- `idx_itinerary_blocks_itinerary_id`
- `idx_itinerary_blocks_section_id`
- `idx_itinerary_blocks_day_id`

### Migration `0008_itinerary_styling.sql`

    ALTER TABLE itineraries ADD COLUMN theme_preset TEXT;
    ALTER TABLE itinerary_sections ADD COLUMN theme_preset_override TEXT;
    ALTER TABLE itinerary_segments ADD COLUMN is_highlighted INTEGER DEFAULT 0;
    CREATE TABLE IF NOT EXISTS itinerary_blocks ( ... );
    CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_itinerary_id ON itinerary_blocks(itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_section_id ON itinerary_blocks(section_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_day_id ON itinerary_blocks(day_id);

Also add all four columns/table to `scripts/setup-db.js` `requiredColumns` for fresh installs.

## 6. API Changes

### New routes

    POST   /api/itineraries/[id]/blocks                 # create block
    PATCH  /api/itinerary-blocks/[blockId]              # update block
    DELETE /api/itinerary-blocks/[blockId]              # delete block
    GET    /api/itineraries/[id]/blocks                 # list blocks for itinerary
    GET    /api/days/[dayId]/blocks                     # list blocks anchored to a day
    GET    /api/sections/[sectionId]/blocks             # list blocks anchored to a section

### Extend existing

    PATCH /api/itineraries/[id]      # accepts { themePreset }
    PATCH /api/sections/[id]         # accepts { themePresetOverride }
    PATCH /api/segments/[id]         # accepts { isHighlighted }

All new/updated routes must include ownership validation (see §10).

### Zod schemas

Add to `lib/validation/itinerary.ts`:

    CreateItineraryBlockSchema
    UpdateItineraryBlockSchema
    UpdateItineraryThemeSchema
    UpdateSectionThemeOverrideSchema
    UpdateSegmentHighlightSchema

Each validates palette name against `PALETTES`, slot against enum, size against enum, block_type against enum.

## 7. UI Changes

### Admin editor (`components/admin/itinerary/`)

- **`ItineraryEditor.tsx`** — add theme dropdown at the top (Inherit site / Coastal / Desert / Alpine / Editorial / Tropical / Minimal).
- **`SectionEditor.tsx`** — add section theme override dropdown.
- **`SegmentsEditor.tsx`** — add "Highlight this segment" checkbox to `SegmentRow`.
- **`DayBlocksEditor.tsx`** (new) — list blocks per day, grouped by slot. Renders inside `DayRow` in `DaysEditor.tsx` or as a sub-section of `DayView`.
- **`AddBlockForm.tsx`** (new) — modal or inline form. Type selector (Image / Callout / Notice). Then type-specific fields. Uses `ImageSourcePicker` for images.
- **`BlockPaletteOverrideSelect.tsx`** (new, small) — optional palette dropdown on blocks.

### Client renderer (`components/portal/itinerary/ItineraryView.tsx`)

- `SectionView` resolves theme: section override → itinerary → site. Passes resolved palette down.
- `DayView` accepts `blocksBySlot` and renders block cards between time-grouped segments.
- `SegmentCard` and `TravelCard` apply highlight styling when `segment.isHighlighted` — accent border + accent icon tint.
- New `BlockCard` component — renders image / callout / notice with size class and optional palette override.

### Slot anchors (client)

Render order per day:

    [slot: before-day]
    [time group: morning]
    [slot: after-morning]
    [time group: afternoon]
    [slot: after-afternoon]
    [time group: evening]
    [slot: after-evening]

Slots render even when empty (they render nothing, but the anchor exists so an empty day still works).

## 8. Print Behavior

Print stylesheet must handle:

- **Hero images** — max-height 60vh, `object-fit: cover`, no print cropping.
- **Block images** — max-height capped at half page height; never span a page break.
- **`break-inside: avoid`** on every block card (image, callout, notice).
- **Full-width block images** — sized to print content width, not viewport.
- **Section headers** — stay with at least one day (use `break-after: avoid`).
- **Highlight segments** — accent border renders in print; if print is monochrome, the border remains but in grey. No dependency on colour for meaning.

Print CSS lives in `ItineraryView.tsx` under `@media print` (existing pattern — confirmed by existing print header/footer). New block cards must add their own print rules inline.

## 9. Security Requirements

Every new API endpoint must enforce:

1. **Authentication** — `requireAuth()` (already standard).
2. **Ownership** — verify the itinerary belongs to an entity the authenticated user can access. Since Myah is a single admin in V1, this is effectively "the itinerary exists and is not soft-deleted". For V2 multi-admin, the check becomes "the itinerary's portal's owner == authenticated user".
3. **Cascade ownership** — for block create/update/delete:
   - Fetch the target section or day by ID.
   - Verify it belongs to the itinerary in the request body.
   - Verify section_id XOR day_id (never both, never neither).
4. **Content Library access** — when a block references a library image, validate the `content_library` row exists and is not soft-deleted before accepting the URL.
5. **URL sanitisation** — reuse `sanitizeBackgroundImage` (or a sibling) to reject `javascript:`, `data:`, and unlisted-host URLs.
6. **Rate limiting** — inherit existing rate limit middleware if present; otherwise log for a follow-up.

**Note on existing routes:** `app/api/sections`, `app/api/days`, `app/api/segments` currently only call `requireAuth()` without explicit ownership verification (verified via grep returning zero `portalId`/`portal_id` lookups). This is acceptable in V1 (single-admin) but becomes a latent gap when V2 multi-admin ships. New routes follow the stricter pattern; retrofitting the old routes is deferred to Phase 7.3 (Production Hardening).

## 10. Migration Strategy

**Step 1** — Schema
- Write `drizzle/migrations/0008_itinerary_styling.sql`
- Add entries to `scripts/setup-db.js` requiredColumns
- Update `drizzle/schema/itineraries.ts` with the three new columns + new `itineraryBlocks` table

**Step 2** — Palette extraction
- Create `lib/theme/palettes.ts`
- Update `PalettePicker.tsx` to import from it
- No behaviour change — pure refactor

**Step 3** — Backend
- Add Zod schemas
- Add repository functions (`lib/itineraries/blocks.ts` or extend `index.ts`)
- Add API routes
- Ownership validation on all new routes
- Extend `getFullItinerary` to batch-load blocks (avoid N+1)

**Step 4** — Admin UI
- Add theme dropdown to `ItineraryEditor`
- Add theme override dropdown to `SectionEditor`
- Add highlight checkbox to `SegmentsEditor`
- Add `DayBlocksEditor` + `AddBlockForm` + `BlockPaletteOverrideSelect`

**Step 5** — Client renderer
- Theme resolution in `SectionView`
- Slot-based block rendering in `DayView`
- Highlight styling in `SegmentCard` and `TravelCard`
- New `BlockCard` component

**Step 6** — Print
- Verify hero, block image, full-width, page-break behaviour
- Adjust `@media print` rules as needed

**Step 7** — No data migration required
- New columns default to NULL (inherit)
- `is_highlighted` defaults to 0
- `itinerary_blocks` starts empty
- Existing itineraries render identically to before (all inherits resolve to site default)

## 11. Future Expansion Opportunities

Deferred but architecturally supported by this plan:

- **Additional block types** — video, quote, quickFacts. The `block_type` enum expands; schema unchanged.
- **Slot additions** — e.g., "after-lunch" if the day model gains more granularity. Slots are strings; additions are additive.
- **Per-itinerary custom palette** — V2 could let an itinerary define a one-off palette. The `theme_preset` column becomes `theme_preset OR theme_custom_json`.
- **Sectional hero images** — sections could gain a `hero_image` column separate from blocks. Currently out of scope.
- **PDF export pipeline** — replaces browser print when the deck justifies it. Print stylesheet is a stepping stone.
- **Client-editable highlights** — not planned, but the `is_highlighted` flag could be exposed to portal members if desired.

## 12. Explicitly Rejected Features

| Feature | Reason |
|---------|--------|
| Canva-style editing | Platform is not a design tool |
| Drag-and-drop positioning | Freeform layouts break responsive + print |
| Freeform layouts | Same |
| Per-segment palette selection | Creates design work; conflicts with "segment colours derive from type + theme" |
| Raw unrestricted design controls | Guardrail violation |
| Custom hex pickers per itinerary/section | Guardrail violation |
| Per-day theme override | Adds a fourth inheritance level with minimal benefit |
| Per-stay theme override | Not a meaningful visual surface |
| Freeform block positioning on page | Slots are rendering anchors, not coordinates |
| Arbitrary image sizes | Fixed presets (Small / Medium / Full) only |
| Block ordering within a slot | Position is secondary; append-only in V1 |
| Segment attendees / people tagging | Lives in Notepad only (existing guardrail) |

