# Phase 7.6 — Test Checklist (PENDING)

> **This checklist predates the September 18 break session.** Features added since (Picture-in-Picture preview, divider config popover, context menu submenus, gradient tiles, body content versioning) are **not yet covered** in this file. See `docs/TODO.md` → "Testing Debt — Coverage Map" for the full list of gaps.

Everything since Wave 2 has been implemented without local testing. Run this on the local PC.

## Setup

~~~
git pull origin main
node scripts/setup-db.js
node scripts/migrate-travel-segments-to-legs.js
npm run dev
~~~

## Wave 2 — Multi-leg Travel

- [ ] **2.1** Existing travel segments migrated to legs — Singapore demo AC0020 shows chained leg card
- [ ] **2.2** Multi-leg creation — YYZ → YYC → NRT, verify "4h connection" gap + "+1 day" arrival badge
- [ ] **2.3** Non-flight modes — Train/Bus/Transfer change field labels
- [ ] **2.4** Leg deletion guard — "Delete the segment instead of its last leg"
- [ ] **2.5** Timezone labels — cosmetic only, blank by default
- [ ] **2.6** Reference dropdown still works on segments

## Wave 3 — Ban / Revoke / Unban

- [ ] **3.1** Ban flow — Active badge + Ban button; magic link works pre-ban
- [ ] **3.2** Ban kills access — live session denied, badge goes red
- [ ] **3.3** Unban requires fresh link — old link stays dead, new link works
- [ ] **3.4** Ban exclusion — banned member gets no new email
- [ ] **3.5** Session invalidation — refresh denies after ban

## Wave 4 — Hero Styling + Accent

- [ ] **4.1** Hero size options — Banner/Medium/Large/Full change preview height
- [ ] **4.2** Text overlay — title/subtitle/caption with gradient scrim
- [ ] **4.3** Image upload from PC — returns /uploads/...
- [ ] **4.4** Paste URL tab works
- [ ] **4.5** Accent colour live — Featured badge + Verdict stripe turn magenta when accent changed
- [ ] **4.6** Primary colour propagates — headings red when primary set to red

## Regression

- [ ] Login works
- [ ] Homepage feed loads
- [ ] Create new post/guide/review works
- [ ] Media library loads
- [ ] Settings page loads
- [ ] Portal wall preview works
- [ ] Client itinerary preview works
- [ ] Print / Save PDF works
- [ ] No console errors

---

## Phase 7.8 — Data Entry Automation

### Setup

~~~
git pull origin main
node scripts/setup-db.js      # adds entities + field_values + order_mode + manual_position
npm run dev
~~~

Note: Phase 7.8 schema lands automatically via setup-db.js — no separate migration script.

### Wave A — Suggestion system

**Test A1 — Entity memory: hotel**
- [ ] Open an itinerary editor, add a stay
- [ ] Type "Oakwood" in Hotel Name
- [ ] Dropdown shows matching entities (★ prefix = entity)
- [ ] Select the entity → Address field auto-fills (only if it was empty)
- [ ] Save. Re-open the itinerary. Edit the same stay
- [ ] Type "Oak" again → same entity appears at top of dropdown

**Test A2 — Entity hydration is touched-safe**
- [ ] Add a new stay
- [ ] Type "Oakwood" and accept the entity (Address fills)
- [ ] Manually change Address to something else
- [ ] Type "Oak" again and accept the entity a second time
- [ ] Confirm: Address keeps the manual value, does not get overwritten

**Test A3 — Field value memory**
- [ ] Add several segments with locations like "Shibuya", "Shinjuku", "Shibuya"
- [ ] Save each
- [ ] Add another segment, start typing "Shi" in Location
- [ ] Both "Shibuya" and "Shinjuku" appear (○ prefix = field value)
- [ ] "Shibuya" appears above "Shinjuku" (higher use_count)

**Test A4 — Static airports**
- [ ] Add a travel segment, mode=flight
- [ ] Type "YYZ" in From field
- [ ] Dropdown shows "YYZ · Toronto Pearson International" (◆ prefix = static)
- [ ] Accept → field saves just "YYZ" (the code, not the full string)

**Test A5 — Static airlines**
- [ ] In the Operator field, type "Air C"
- [ ] Dropdown shows "Air Canada" from statics

**Test A6 — Per-field ranking override (leg.origin)**
- [ ] Fly from YYZ three separate times (three different segments)
- [ ] Type "YYZ" — should still show static first until use_count >= 5
- [ ] After 5 uses, field value should outrank the static entry

**Test A7 — Field value filter**
- [ ] Type a typo once ("Shibuyaa") in a location
- [ ] Save
- [ ] Start typing "Shib" — typo should NOT appear (use_count < 2)
- [ ] Use the typo again (or manually fix and re-save)
- [ ] After use_count >= 2, typo appears

### Wave B — Duplication

**Test B1 — Duplicate segment**
- [ ] Open a day with a segment
- [ ] Click "Duplicate" on the segment row
- [ ] A copy appears (verify by segment count in the day)
- [ ] Travel legs copied if the source was a travel segment
- [ ] Copy has manual_position = null (open dev tools / check DB)

**Test B2 — Duplicate day**
- [ ] Open a section with a populated day (multiple segments + maybe blocks)
- [ ] Click "Duplicate" on the day row
- [ ] New day appears at date +1 with dayNumber +1
- [ ] All segments copied, all legs copied, day-anchored blocks copied
- [ ] orderMode on the new day = "time" (manual order not carried)
- [ ] Section-anchored blocks are NOT copied (only day-anchored)

**Test B3 — Extend by one day**
- [ ] Open a section, click "Extend by 1 day"
- [ ] New empty day appears with date +1 from the latest day

### Wave B — Drag-reorder

**Test B4 — Toggle manual order**
- [ ] Open a day with 3+ segments. Default: no drag handles
- [ ] Click "Manual order" on the day row
- [ ] Drag handles (⋮⋮) appear on segments
- [ ] "Manual order" button is replaced by "Reset order"

**Test B5 — Drag to reorder**
- [ ] Drag segment 3 above segment 1
- [ ] On drop, order persists (refresh page → order kept)
- [ ] Server received `PATCH /api/days/[id]/order` with the reordered ID array

**Test B6 — Disagreement indicator**
- [ ] Set manual order so a segment with later startTime is above one with earlier startTime
- [ ] ⚠ appears next to the type label on the out-of-order segment
- [ ] Editor-only — client-facing render does NOT show it

**Test B7 — Reset to time order**
- [ ] With manual order active, click "Reset order"
- [ ] Segments re-sort by startTime
- [ ] Drag handles disappear, "Manual order" button returns

**Test B8 — New segment defaults to time order in manual day**
- [ ] In a manual-ordered day, add a new segment
- [ ] New segment arrives with manual_position = null
- [ ] It sorts by its startTime within the day, not at the end

### Regression checks (Phase 7.8 additions)

- [ ] Duplication of a day with blocks does NOT double-count section blocks
- [ ] Cross-itinerary copy still requires target itinerary to exist (403 if not)
- [ ] Recording doesn't slow down saves noticeably (each save should still feel instant)
- [ ] After many saves, `entities` and `field_values` grow, no duplicates (unique constraint holds)
- [ ] Autocomplete dropdown closes on outside click and on Esc
- [ ] Autosave indicator still shows on AutocompleteField (editor views) but not AutocompleteInput (add forms)

### Handy SQL queries (Phase 7.8)

Check what's been learned:

~~~
node -e "const db=require('better-sqlite3')('data/site.db'); const r=db.prepare('SELECT kind, canonical_name, use_count FROM entities ORDER BY use_count DESC LIMIT 10').all(); console.log(r); db.close();"
~~~

Field values by use:

~~~
node -e "const db=require('better-sqlite3')('data/site.db'); const r=db.prepare('SELECT field_key, value, use_count FROM field_values ORDER BY use_count DESC LIMIT 15').all(); console.log(r); db.close();"
~~~

Manual-order state:

~~~
node -e "const db=require('better-sqlite3')('data/site.db'); const r=db.prepare('SELECT id, date, order_mode FROM itinerary_days WHERE order_mode = \'manual\'').all(); console.log(r); db.close();"
~~~

Segments with manual positions:

~~~
node -e "const db=require('better-sqlite3')('data/site.db'); const r=db.prepare('SELECT id, day_id, title, start_time, manual_position FROM itinerary_segments WHERE manual_position IS NOT NULL ORDER BY day_id, manual_position').all(); console.log(r); db.close();"
~~~

---

## Phase 7.8 Wave C — Bulk-Add + Backfill

**Test C1 — Bulk-add parser**
- [ ] Open a day, click "Bulk add"
- [ ] Paste: `08:00-09:00 | Test Activity | Test Location`
- [ ] Preview table shows one row
- [ ] Paste multi-line with travel sub-syntax: `07:00-08:00 | travel/flight | YYZ -> NRT | AC0020`
- [ ] Preview shows travel segment with parsed leg

**Test C2 — Bulk-add commit**
- [ ] Paste 3 valid lines
- [ ] Click "Add 3 segments"
- [ ] All 3 land in the day (count increments by 3)
- [ ] Travel segment has a leg row

**Test C3 — Bulk-add rollback**
- [ ] Paste a line with a bad format that will fail parse
- [ ] Error shown, commit button disabled
- [ ] Fix the error, commit works

**Test C4 — Bulk-add localStorage draft**
- [ ] Paste content, don't commit
- [ ] Navigate away
- [ ] Return to the same day, click "Bulk add"
- [ ] Textarea content preserved

**Test C5 — Backfill idempotency**
- [ ] Run `node scripts/backfill-suggestions.js` twice
- [ ] Entity counts should be identical both times (not doubled)

### Phase 7.8 Wave D — Closing features

**Test D1 — Snippet creation**
- [ ] Open a segment's instructions field
- [ ] Click "Snippets" → "+ Create new snippet"
- [ ] Enter title + content, save
- [ ] Snippet appears in the dropdown

**Test D2 — Snippet insertion**
- [ ] In instructions field, click Snippets, pick one
- [ ] Content appended to instructions
- [ ] Snippet use_count bumped (check DB)

**Test D3 — Paste booking (Air Canada)**
- [ ] Open a flight leg, click "Paste booking"
- [ ] Paste text containing "AC0020", "YYZ to NRT", "Confirmation: ABC123"
- [ ] Parser detects source = air-canada, shows extracted fields
- [ ] "Apply to Form" fills operator, identifier, origin, destination, reference

**Test D4 — Paste booking (hotel)**
- [ ] Paste text containing "Marriott" and an address
- [ ] Parser detects hotel-generic
- [ ] Apply fills hotel name + address

**Test D5 — Stale entities admin page**
- [ ] Navigate to /admin/suggestions/stale-entities
- [ ] Shows entities used once and not touched in 90+ days (likely empty right now)
- [ ] Delete button removes entity, it stops appearing in autocomplete

**Test D6 — Kill switch**
- [ ] Set `NEXT_PUBLIC_AUTOCOMPLETE_ENABLED=false` in .env
- [ ] Restart dev server
- [ ] Autocomplete dropdowns no longer appear
- [ ] Forms still work as plain inputs
- [ ] Reset to true and restart

---

## Phase 7.9 — Post Editor and Writing Tools (CODE-COMPLETE — needs local test)

Tests written as each wave ships.

- Test E1-E5 — Toolbar: bold/italic/underline, colour presets, highlight, font family, size
- Test E6-E8 — Pop-out preview, fullscreen, no-modal
- Test E9 — Paste sanitization (paste from Word/Gmail, confirm no inline styles leak)
- Test E10 — Word count + reading time
- Test E11 — YouTube URL auto-embed
- Test E12 — Colour preset create / overwrite / apply

---

## Phase 9 — Client Memory System (CODE-COMPLETE — needs local test)

Tests written as each wave ships.

- Test F1 — Add portal member with existing email, suggests name from people, links person_id
- Test F2 — Add portal member with new email, creates person record
- Test F3 — Person page: global notes, trip tabs, itinerary per tab
- Test F4 — Client notes dashboard: search by name, email, note content
- Test F5 — Forget this client: hard delete person + notes + history, portal_members.person_id nulled
- Test F6 — Portal purge at return_date + 90: portal deleted, itinerary kept, person_trip_history written
- Test F7 — Per-portal keep_until override prevents purge
- Test F8 — Itinerary Library: filter live/archived/template, preview, use-as-template flow
- Test F9 — Reused itinerary as template: sections/days/segments copied, occurrence data cleared

---

## Phase 7.9 break-session additions (NOT YET COVERED)

Features added in the September 18 break session. These are shipped but have no browser test yet.

### PiP — Picture-in-Picture preview

**Test P1 — PiP opens**
- [ ] In the post editor, click the PiP button on the preview popout
- [ ] An OS-level PiP window appears, showing the live template preview
- [ ] Window is draggable across monitors
- [ ] Content updates as you edit (both directions)

**Test P2 — Stylesheets + theme vars copied**
- [ ] Open PiP while editing a post with custom accent colour
- [ ] PiP window renders with the same theme colours as the main window
- [ ] Headings, badges, accent elements match

**Test P3 — Escape closes**
- [ ] With PiP focused, press Escape
- [ ] PiP window closes, editor remains open and unchanged

**Test P4 — Unsupported fallback**
- [ ] In a browser without `documentPictureInPicture` (Firefox, Safari), click the PiP button
- [ ] Clean fallback — no error thrown, popout continues to work

**Test P5 — PreviewPopout bounds clamping (currently BROKEN — see TODO Outstanding Bugs #1)**
- [ ] Drag the in-page popout upward until its title bar goes off-screen
- [ ] Currently: popout becomes unrecoverable. Fix pending.
- [ ] After fix: `top` clamps to viewport top, title bar stays reachable

### Divider config popover

**Test P6 — Divider insert**
- [ ] In Body editor, insert a divider from the toolbar
- [ ] A horizontal rule appears at cursor position

**Test P7 — Divider thickness**
- [ ] Click the divider, open config popover
- [ ] Change thickness (thin / medium / thick) — divider re-renders immediately
- [ ] Value persists after save + reload

**Test P8 — Divider colour**
- [ ] Change colour via the popover
- [ ] Divider renders in the chosen colour
- [ ] Colour persists after save + reload

### Context menu submenus

**Test P9 — Keyboard open**
- [ ] Select text in Body editor, press Shift+F10
- [ ] Context menu opens at selection

**Test P10 — Arrow navigation**
- [ ] With context menu open, arrow keys move selection
- [ ] Enter activates the focused item
- [ ] Escape closes the menu

**Test P11 — Submenus (colour / size / font)**
- [ ] Open context menu, hover "Colour" — submenu appears
- [ ] Select a colour — text updates immediately
- [ ] Repeat for Size and Font submenus
- [ ] All three apply correctly to the selected text

### Body content versioning envelope

**Test P12 — Envelope round-trip**
- [ ] Create a new post, add a Body block, type text with bold + a colour mark
- [ ] Save
- [ ] Reload the post — text, bold, colour all render correctly
- [ ] Open DB: `data.tiptapJson` should be `{"version":1,"content":...}`, not bare doc

**Test P13 — Legacy bare doc still readable**
- [ ] Manually edit a post's `tiptapJson` in DB to strip the envelope (bare doc)
- [ ] Reload the editor — no crash, text renders
- [ ] Save — the envelope is reapplied on write

**Test P14 — Envelope unwrap on load (commit 4b32d7c)**
- [ ] Open an existing post with a wrapped envelope
- [ ] Editor shows the content, not raw JSON
- [ ] Save without changes — envelope remains correct (not double-wrapped)

---

## Block system coverage (NO BROWSER TEST)

Body block has coverage above (P12–P14). The other nine have none. Each needs at minimum: add → configure → save → reload → client render.

- [ ] **Title block** — level 1/2/3 renders correct heading; persists
- [ ] **Hero block** — size options (Banner/Medium/Large/Full), text overlay (title/subtitle/caption), image upload/URL/library, gradient scrim
- [ ] **Image block** — single image, caption, `ImageSourcePicker` (upload/URL/library)
- [ ] **Gallery block** — grid layout, multiple images, order, captions. **NOTE: still URL-only inputs, should reuse `ImageSourcePicker` — see TODO Outstanding Bugs #3**
- [ ] **Callout block** — tip/warning/info variants render distinct styling; status colours fixed
- [ ] **ProsCons block** — two-column, add/remove rows, save round-trip
- [ ] **Verdict block** — text + star rating; accent stripe renders; star count persists
- [ ] **QuickFacts block** — label/value pairs, add/remove, save round-trip
- [ ] **Quote block** — text + author, blockquote styling

**Template selection in editor:**
- [ ] New post opens with template chooser
- [ ] Selecting a template sets the block order + which blocks are required/optional/disabled
- [ ] Switching templates mid-edit preserves content where block types overlap
- [ ] Legacy Canvas template rows do NOT appear in the chooser (`loadTemplatesFromDb` filter)

---

## Client-facing rendering (NO BROWSER TEST)

The admin-side preview has been tested. The public-facing pages have not.

- [ ] `/blog/[slug]` — renders blocks via `PostRenderer`; CSS vars applied; TipTap HTML sanitised by DOMPurify; no raw JSON leaks
- [ ] `/guides/[slug]` — same as blog
- [ ] `/reviews/[slug]` — same, plus Verdict block accent stripe and Featured badge
- [ ] Long-form post with all 10 block types — no layout breaks, no console errors
- [ ] Post with inline colour marks in Body — colours survive to public render (this is the whole point of the `buildExtensions` + `DOMSerializer` fix)
- [ ] Post with font-family and font-size marks — same
- [ ] Post with divider (custom thickness + colour) — renders correctly
- [ ] Post with YouTube embed — inline player renders, invalid ID falls back gracefully
- [ ] `/` homepage feed — cards load, infinite scroll works, filters work
- [ ] Search results — `/search?q=...` returns matching posts/guides/reviews

---

## Security — TOTP Enrollment (PENDING — new enforcement)

**Test S1 — First login after enforcement**
- [ ] Log in with admin credentials
- [ ] Automatically redirected to `/admin/enroll-2fa`
- [ ] Secret is displayed for manual entry
- [ ] otpauth URL is displayed as an alternative
- [ ] QR code (if implemented as image) renders correctly

**Test S2 — Enrollment confirmation**
- [ ] Add the secret to an authenticator app
- [ ] Enter the 6-digit code
- [ ] Redirected to `/admin` on success
- [ ] Invalid code shows error and stays on enrollment page
- [ ] Expired code (older than 30s) shows error

**Test S3 — Subsequent login**
- [ ] Log out and log back in
- [ ] Login now requires both password and TOTP code
- [ ] Correct code grants access
- [ ] Incorrect code rejected
- [ ] Rate limit still applies (5 attempts / 15 min)

**Test S4 — Forced redirect edge case**
- [ ] While enrolled, navigating to `/admin/enroll-2fa` redirects to `/admin`
- [ ] While NOT enrolled, navigating to any `/admin/*` route (except `/admin/login` and `/admin/enroll-2fa`) redirects to enrollment

**Test S5 — TOTP recovery**
- [ ] If authenticator app is lost, recovery requires DB-level intervention
  (Document this as a known limitation — recovery codes deferred to Phase 8+)

## Batch A — Gallery block reuses ImageSourcePicker

**Commit:** (pending)

### What was built
Gallery block now uses `ImageSourcePicker` per image slot, matching Hero and Image blocks. Each gallery image can be uploaded from PC, pasted by URL, or picked from the content library (where wired by the picker). Caption input preserved. Add/remove slot UI restructured for clarity — empty state message, per-image card with labelled Remove button.

### Test cases
- [ ] Open a post editor, add a Gallery block
- [ ] Click "Add Image" → new slot appears with Upload/Paste URL toggle
- [ ] **Upload from PC:** choose an image file → preview appears, URL path shown
- [ ] **Paste URL:** switch to URL mode, paste a valid image URL → preview appears
- [ ] Click "Clear" on a slot → URL clears, preview disappears
- [ ] Add a caption to an image → caption persists after save/reload
- [ ] Add a second image → both slots render independently
- [ ] Remove the second image → first image and caption unchanged
- [ ] Save post → reload editor → gallery images preserved with URLs and captions
- [ ] Publish post → view `/blog/[slug]` → gallery renders all images at correct URLs
- [ ] Print view (`Ctrl+P`) → gallery images render, not broken
- [ ] Empty gallery (no images) → editor shows "No images yet" message, page does not error
- [ ] Gallery with one image → renders correctly on client
- [ ] Image upload failure (e.g. disconnected) → error message shown, slot not corrupted

### Known limitations
- Gallery images do not yet have `alt` text (Image and Hero blocks have it). Adding alt is a separate batch — needs `GalleryData` type change and `GalleryRenderer.tsx` update.
- Library picker is provided by `ImageSourcePicker` as currently implemented — this batch wires the picker in, but does not extend the picker's library integration beyond what Hero and Image already have.

## Batch B — Body editor Tab handler

**Commit:** (pending)

### What was built
Tab in the Body block editor now indents list items (`sinkListItem`) instead of indenting the whole block. Shift+Tab outdents (`liftListItem`). Tab outside a list is consumed (preventDefault, no-op) so it no longer moves focus out of the editor. Handler is `editorProps.handleKeyDown` on `TipTapEditor` — editor-only, no changes to `buildExtensions`, no effect on renderers.

### Test cases
- [ ] In a Body block, create a bulleted list with two items
- [ ] Place cursor in the second item, press Tab → second item indents under the first
- [ ] Press Tab again → item indents further (nested level 3)
- [ ] Press Shift+Tab → item outdents one level
- [ ] Press Shift+Tab again → item returns to flat list
- [ ] Numbered list — same Tab / Shift+Tab behaviour
- [ ] Cursor in a paragraph (not a list), press Tab → nothing happens, cursor stays in editor, focus does not move to next input
- [ ] Cursor in a heading, press Tab → nothing happens
- [ ] Cursor in a blockquote, press Tab → nothing happens, focus stays in editor
- [ ] In a list item with existing content, Tab preserves the text (doesn't drop it)
- [ ] In a list item at the first position, Shift+Tab → item stays a list item at top level (no lift-out to paragraph — ProseMirror handles this gracefully)
- [ ] Multi-line selection in a list, Tab → both items indent together (ProseMirror's standard behaviour)
- [ ] Verify: Tab key does not tab you out of the editor to the toolbar or next field
- [ ] Verify: Shift+Tab does not tab you backwards out of the editor

### Known limitations
- Tab is consumed globally inside the editor when not in a list. If a future feature needs Tab-to-navigate within the editor (e.g. table cells), the handler will need a table-aware branch.
- Code block Tab insertion is out of scope for this batch — ProseMirror's default code block behaviour is unchanged.

## Batch C — PreviewPopout bounds clamping

**Commit:** (pending)

### What was built
`PreviewPopout` now clamps position and size so it can never be dragged off-screen, resized beyond the viewport, or left unreachable after a window shrink. Clamping applies at three points: during drag, during resize, on window resize. Reclamp uses `clampPosition` (keeps title bar reachable, at least 200px horizontally visible) and `clampSize` (clamps to viewport, honours MIN_WIDTH/MIN_HEIGHT). Also fixed a pre-existing escape bug where the close button rendered the literal string `\u2715` instead of the ✕ glyph.

### Test cases
- [ ] Open the preview popout from a post editor
- [ ] Drag the popout to the top edge → title bar stays visible, popout cannot go above y=0
- [ ] Drag to the left edge → at least 200px of the popout remains visible
- [ ] Drag to the right edge → at least 200px remains visible
- [ ] Drag to the bottom edge → title bar stays visible
- [ ] Resize the popout from the bottom-right handle → cannot exceed viewport width or height
- [ ] Resize very small → stops at MIN_WIDTH (320) / MIN_HEIGHT (240)
- [ ] Shrink the browser window → popout repositions and resizes to stay in view
- [ ] Enlarge the browser window → popout stays where it was, no jump
- [ ] Close button renders ✕ (not `\u2715` text)
- [ ] PiP button still works — pops out to OS window, unaffected by clamping
- [ ] Fullscreen still works — Esc exits fullscreen, then Esc closes popout
- [ ] Esc inside PiP closes PiP window, then Esc closes popout

### Known limitations
- Position is not persisted across sessions — the popout resets to `{x: 80, y: 80}` on every mount, so the off-screen-saved-state scenario does not arise. If persistence is added later, clamping must be applied on mount from saved state.
- Multi-monitor drag is not clamped to the primary viewport — a user with two screens can drag the popout across monitors via PiP only, not the in-page popout. This matches the design intent (PiP is the multi-monitor path).

## Batch D-a — Itinerary Client Experience (Glance on correct model)

**Commits:** 1dbb231, a7f98e9, d8f75fd, cfe7e40, f4b45fd, ee1fbc5, ebd530a, a5b1afa, 35ee99d, 40f49ba, 283d675, 4eebf67

### What was built

**Data model:**
- Migration `0018_portal_items_source_type_expansion.sql` — table rebuild, `source_type` CHECK extended to include `itinerary_glance` and `itinerary_today`; `type` and `category` CHECKs preserved; `variant` column removed (reverted)
- `types/portal-items.ts` — `PortalItemSourceType` union and `ITINERARY_SOURCE_TYPES` constant

**Derivation:**
- `lib/itineraries/attach-derived-items.ts` — replaces `attach-glances.ts`; branches on `itinerary_glance` only; per-item failure isolation; `derivedError: true` on failure
- 9 tests covering glance branch, pass-through, failure isolation

**Rendering:**
- `PortalWall.tsx` — `itinerary_glance` tiles render inline full-width; neutral "Summary unavailable" fallback when `glance` missing or `derivedError`; unknown source types logged and skipped
- `PortalItemsList.tsx` — five-way source label (Library / Itinerary / At a Glance / Day by Day / Portal-specific)

**Admin:**
- `attach/route.ts` — accepts `viewType` (full / glance / today), defaults to `full`; blocks duplicates with 409
- `portals/[id]/itinerary/page.tsx` — three-button attach group per itinerary row (Full / Glance / Today); 409 toast

**Wiring:**
- `app/portal/[portalSlug]/page.tsx` and `app/admin/(dashboard)/portals/[id]/preview/page.tsx` — call `attachDerivedItems` and pass `itemsWithDerived` to `PortalWall`

### Test cases

**Unit (automated):**
- [x] `attachDerivedItems` — glance item gets glance data
- [x] `attachDerivedItems` — `itinerary` (full) passes through unchanged, no DB call
- [x] `attachDerivedItems` — library passes through unchanged
- [x] `attachDerivedItems` — portal_specific passes through unchanged
- [x] `attachDerivedItems` — unknown source_type passes through unchanged, no DB call
- [x] `attachDerivedItems` — null itineraryId sets derivedError
- [x] `attachDerivedItems` — missing itinerary sets derivedError
- [x] `attachDerivedItems` — thrown derive sets derivedError, no throw propagates
- [x] `attachDerivedItems` — one failing item does not block others
- [x] Existing `deriveGlance` tests still pass (15)
- [x] Existing 87 base tests still pass

**Migration (manual):**
- [ ] `node scripts/setup-db.js` shows `0018_portal_items_source_type_expansion.sql` with `✓`, no `✗`
- [ ] `.schema portal_items` shows `source_type` CHECK with five values
- [ ] `.schema portal_items` shows `type` CHECK `('pdf', 'image', 'text')` preserved
- [ ] `.schema portal_items` shows `category` CHECK preserved
- [ ] `.schema portal_items` shows no `variant` column
- [ ] Both indexes present: `idx_portal_items_portal_id`, `idx_portal_items_position`
- [ ] Existing `portal_items` rows survived the rebuild (count matches pre-migration)

**Admin UI (browser):**
- [ ] `/admin/portals/[id]/itinerary` shows three buttons per itinerary row: Full / Glance / Today
- [ ] Click "Full" on an unattached itinerary → success toast "Itinerary attached as Full", item appears on wall as full tile
- [ ] Click "Glance" on an unattached itinerary → success toast "Itinerary attached as At a Glance", item appears on wall as glance tile
- [ ] Click "Today" on an unattached itinerary → success toast "Itinerary attached as Day by Day" (renders nothing yet — D-b)
- [ ] Click "Glance" on an itinerary already attached as glance → info toast "This itinerary is already attached with that view type", no duplicate created
- [ ] Same itinerary can be attached as Full, Glance, and Today simultaneously
- [ ] `/admin/portals/[id]/edit` wall items list shows correct label per source type: "Itinerary", "At a Glance", "Day by Day", "Library", "Portal-specific"

**Wall rendering (browser):**
- [ ] Portal wall with one glance item → glance renders full-width, auto-populated (days, hotels, transport, anchors)
- [ ] Portal wall with full + glance + today for same itinerary → full tile renders as tile, glance renders full-width, today renders nothing (D-b)
- [ ] Portal wall with glance whose itinerary was deleted → "Summary unavailable" tile, no crash
- [ ] Portal wall with unknown source_type → skipped, logged to console, no crash
- [ ] Existing full itinerary tiles still render correctly

**Access control (manual — presentation model):**
- [ ] Client with glance-only wall can still open full itinerary by URL `/portal/[slug]/itinerary/[id]` — this is intended, not a bug
- [ ] Client cannot open an itinerary belonging to a different portal

**Print (browser):**
- [ ] Glance tile has Print button top-right
- [ ] Click Print → print preview hides admin chrome (header, nav, logout)
- [ ] Print preview hides hero banner and footer
- [ ] Print preview shows only glance tile(s), full-width
- [ ] Ctrl+P on a wall with NO glance → normal wall prints (chrome and tiles visible, no blank page)

### Known limitations
- Day by Day button attaches the tile but renders nothing (D-b delivers the renderer)
- Print CSS was verified structurally in D1; re-verify visually in D-a
- Segment `location` is free text — may contain addresses, deferred to D-b with real data
- Multi-country trips will use one timezone per itinerary (D-b limitation)
- Existing `variant` column dropped by migration 0018 rebuild; smoke-test row (id=1) survived as `source_type='itinerary'`

### D-b deliverable (next batch)
- Migration `0019_itinerary_timezone.sql`
- `timezone` field on `itineraries`, "Auto" option
- `deriveDayByDay` with 5 states (pre-trip / during-trip / post-trip / no-plan-today / no-window)
- `DayByDayView` renderer
- `PortalWall` day-by-day branch
- Print CSS for day-by-day

## Batch D-a layout revision — sidebar, banner slot, visibility flag

**Commits:** 000e6ac, ed230d6, 01f3aa1, 542009d

### What changed from the original D-a

The initial D-a shipped Glance as an inline full-width tile. That was the wrong layout. This revision corrects it to match the actual design:

- **Glance** → sidebar on desktop (right, sticky), inline above grid on mobile
- **Day by Day** → banner slot above the grid, reserved for D-b (renders nothing until D-b)
- **Full Itinerary** → normal grid tile, click to open (unchanged)
- **Other tiles** → normal grid items (unchanged)
- **Visibility flag** → per-item `is_visible` column; admin toggle; client wall filters hidden items; admin preview shows all with "Hidden" badge

### Test cases — layout

- [ ] Portal wall with glance attached, desktop → glance renders as sticky sidebar on the right, grid shrinks to accommodate
- [ ] Portal wall with glance attached, mobile → glance renders inline above the grid (below hero), no sidebar
- [ ] Portal wall without glance, desktop → grid is full width, no sidebar slot
- [ ] Portal wall without glance, mobile → grid full width, no inline glance
- [ ] Glance sidebar stays visible while scrolling the grid (sticky behaviour)
- [ ] Glance sidebar does not overlap tiles when grid has few items
- [ ] Multiple grid tiles render correctly alongside glance sidebar
- [ ] Full itinerary tile opens the full page on click (unchanged behaviour)

### Test cases — visibility flag

- [ ] Admin portal edit page shows a "Visible" checkbox on every attached item
- [ ] New items default to visible (checkbox checked)
- [ ] Uncheck "Visible" → item remains in admin list, checkbox unchecked
- [ ] Uncheck "Visible" → item does NOT appear on client portal wall
- [ ] Uncheck "Visible" → item DOES appear in admin preview, with "Hidden" badge overlay
- [ ] Re-check "Visible" → item reappears on client wall
- [ ] Uncheck "Visible" on glance item → glance sidebar disappears for client, admin preview shows "Hidden" badge on the sidebar
- [ ] Uncheck "Visible" on full itinerary tile → tile hidden from client grid, "Hidden" badge in admin preview
- [ ] Visibility toggle persists across page reload (DB write confirmed)
- [ ] Removing an item entirely (✕) is distinct from hiding it (visibility toggle) — remove deletes, hide keeps

### Migration verification

- [ ] Migration 0020 applied: `portal_items.is_visible INTEGER NOT NULL DEFAULT 1`
- [ ] Existing items defaulted to `is_visible = 1` after migration
- [ ] `PRAGMA table_info(portal_items)` shows `is_visible` column

### API verification (manual)

- [ ] `PATCH /api/portal/[id]/items/[itemId]/visibility` with `{ isVisible: false }` → 200, DB updates
- [ ] Same with `{ isVisible: true }` → 200, DB updates
- [ ] Same with `{ isVisible: "true" }` (string, not boolean) → 400
- [ ] Same with a non-existent item → 404
- [ ] Same without auth → redirect/401

## Batch D-b — Day by Day

**Commits:** 8772560, 2e6a42a, 996b71d, 4ddc13c, 79f6bed, 26d0e23

### What was built

**Schema:**
- Migration `0019_itinerary_timezone.sql` — adds `itineraries.timezone TEXT` (nullable, IANA)
- Schema field + requiredColumns guard

**Derivation:**
- `lib/itineraries/derive.ts` — appended `deriveDayByDay`, `formatDateISOInTimezone`, `computeTodayInTimezone`, `daysBetweenUTC` (private)
- `lib/itineraries/derive-day-by-day.test.ts` — 17 tests
- `lib/itineraries/attach-derived-items.ts` — extended to branch on `itinerary_today`

**Rendering:**
- `components/portal/day-by-day/DayByDayView.tsx` — pre-trip countdown, during-trip today, post-trip welcome home, no-plan-today
- `PortalWall.tsx` — banner slot above grid for itinerary_today items

### Test cases

**Unit (automated):**
- [x] formatDateISOInTimezone returns YYYY-MM-DD in given timezone
- [x] Different timezones produce different dates at same instant
- [x] Null timezone falls back to UTC
- [x] Invalid timezone falls back to UTC
- [x] computeTodayInTimezone uses now parameter
- [x] deriveDayByDay pre-trip state with daysUntil
- [x] Pre-trip across month boundary
- [x] During-trip state with day data
- [x] no-plan-today when today in window but no day row
- [x] Post-trip state
- [x] no-window when itinerary has no days
- [x] Segments ordered by startTime, null last
- [x] Medium detail included: title, times, location
- [x] Data leakage: no instructions, no confirmation, no references
- [x] Stay isCheckinDay/isCheckoutDay flags
- [x] Travel segment gets transport with legCount, operator, origin
- [x] Multi-section: correct day lookup, global day numbering

**Browser (manual):**
- [ ] Attach an itinerary as "Today" via admin portal editor
- [ ] Portal wall shows Day by Day banner above grid
- [ ] Pre-trip: "N days until [destination]"
- [ ] During-trip: "Today · Day N · [date]" with stay + segments
- [ ] Post-trip: "Welcome home"
- [ ] Gap day: "Nothing scheduled today"
- [ ] Visibility toggle hides banner from clients
- [ ] Multiple itinerary_today items stack
- [ ] Travel segments show operator, identifier, origin→destination, leg count
- [ ] Times formatted 12-hour
- [ ] Print preview: banner prints above grid, chrome hidden

### Known limitations
- Timezone editor UI not wired yet — timezone stays null, falls back to UTC
- One timezone per itinerary for multi-country trips
- Date-only matching (overnight flights stay on departure day, intentional)
- "Welcome home" state persists until item removed or hidden

## Batch D-c — Multi-timezone trips

**Commits:** ada7e3c, 9c7b994, 4b28105, 14c6ed6, 605dcdd, 534a623

### What was built

**Schema:**
- Migration `0021_itinerary_sections_timezone.sql` — adds `itinerary_sections.timezone TEXT` (nullable)
- `itineraries.timezone` reinterpreted as "default when section timezone is null"

**Validation:**
- `TimezoneSchema` — validates IANA timezone strings via `Intl.DateTimeFormat`
- `UpdateSectionSchema` — new, validates sections PATCH
- `UpdateDaySchema` — new, validates days PATCH
- Section schemas accept `timezone`
- `CreateDaySchema` unchanged (date uniqueness is repo-level, not Zod)

**Repo:**
- `updateSection` accepts `timezone`
- `createSection` accepts `timezone`
- `duplicateItineraryAsTemplate` copies `section.timezone`
- `findDuplicateDayDate` helper — checks for existing days with the same date across all sections in the itinerary
- `createDay` enforces uniqueness (throws on duplicate)
- `updateDay` accepts optional `date`, enforces uniqueness (excluding self)

**Derivation:**
- `resolveSectionTimezone(section, itinerary)` — centralised inheritance helper
- `deriveDayByDay(full, now: Date, destination)` — signature changed from `today: string`
- Per-section timezone resolution: iterates sections, computes today in each section's timezone, finds the matching day
- Explicit day sort by date before assigning global day numbers
- Ambiguity logging if two sections somehow match (should not happen with uniqueness enforcement)
- Pre-trip / post-trip / gap states use itinerary default timezone

**UI:**
- `TimezoneSelect.tsx` — grouped by region (`<optgroup>`), searchable, "Inherit" option for null
- `SectionEditor` — timezone dropdown below theme override
- `ItineraryEditor` — helper text clarified as "default timezone"

**Routes:**
- Sections PATCH validates via `UpdateSectionSchema`
- Days PATCH validates via `UpdateDaySchema`, returns 409 on uniqueness conflict
- Days POST (createDay) returns 409 on uniqueness conflict

### Test cases

**Unit (automated — `derive-day-by-day.test.ts`):**
- [x] Single-section, single-timezone trips still work (13 existing tests, adapted to `now: Date` signature)
- [x] Multi-section, single itinerary timezone
- [x] Multi-section, per-section timezones — matching section wins
- [x] Pre-trip / post-trip states use itinerary default timezone
- [x] Gap day (no matching day in any section's tz) → no-plan-today

**Browser (manual):**
- [ ] Section editor shows timezone dropdown (grouped by region, searchable)
- [ ] Setting section timezone persists
- [ ] "Inherit itinerary default" option clears section timezone
- [ ] Setting itinerary timezone persists
- [ ] Multi-section itinerary with different timezones: Day by Day picks the correct section based on current time
- [ ] Section with null timezone inherits itinerary default
- [ ] Both null → UTC fallback
- [ ] Search filter narrows timezone list
- [ ] Duplicate date across sections → 409 with clear message ("Dates must be unique across all sections")
- [ ] Editing a day's date to a conflicting date → 409
- [ ] Editing a day's date to a non-conflicting date → succeeds
- [ ] Templates: duplicate itinerary copies section timezones

### Known limitations
- Cross-dateline ambiguity: uniqueness enforcement prevents overlaps, but a flight landing "same day" in a different timezone must be assigned to one section (Myah's data-entry decision)
- No automatic timezone detection from travel legs (future: derive from first leg's destinationTimezone in each section)
- AddSectionForm doesn't include timezone during initial create — set after creation

## Batch F — Phase 7.3 sweep survivors

**Commits:** 951fced, e3c0d09, 8efa6d1, 0604292

### What was built

**6a — Edit page uses BlockEditor:** server wrapper page fetches templates, `EditPostForm` parses content as {blocks, templateId} and renders BlockEditor. Legacy TipTap posts start fresh (no migration needed — DB has 0 posts).

**6b — Publish validation:** client-side check in `handleSave` rejects publish when required blocks empty; server-side check in `updatePostAction` mirrors it. Per-type emptiness criteria in `lib/blocks/validate.ts`.

**7 — Error boundaries per block:** each block editor wrapped in `<ErrorBoundary>` with per-block fallback. Generic fallback in `ErrorBoundary.tsx` replaces Canvas-specific messaging.

**8 — Responsive preview:** desktop / tablet (768px) / mobile (375px) viewport width toggles in `PreviewPopout`. Content wraps in a max-width container with grey surround.

### Test cases

**Edit page (browser):**
- [ ] Create a new post via `/admin/posts/new` — block editor renders
- [ ] Save post → redirect to `/admin/posts/[id]` → block editor loads with saved blocks
- [ ] Add/edit blocks, save, reload — content persists
- [ ] Delete a block, save, reload — stays deleted
- [ ] Switch template, save, reload — template persists

**Publish validation (browser):**
- [ ] New post with empty Title block, status = published → save rejects with 'Cannot publish — required blocks are empty: [label]'
- [ ] Same post, status = draft → saves fine
- [ ] Fill Title block, publish → succeeds
- [ ] Server-side rejection: bypass client with direct POST → still rejects

**Error boundaries (browser):**
- [ ] Corrupt one block's data in DB → page loads, only that block shows fallback
- [ ] Other blocks render normally
- [ ] Removing the corrupt block clears the fallback

**Responsive preview (browser):**
- [ ] Open preview → Desktop button active, full width
- [ ] Click Tablet → preview narrows to 768px centered
- [ ] Click Mobile → preview narrows to 375px centered
- [ ] Click Desktop → back to full width
- [ ] Resize popout while in tablet/mobile mode — max-width preserved
- [ ] Buttons have aria-pressed state for screen readers

### Known limitations
- Legacy TipTap posts (if any existed) start fresh on edit — DB currently has 0 posts so no impact
- ErrorBoundary fallback is generic text; per-block custom fallbacks would require passing `fallback` prop
- Responsive preview only affects preview, not the actual admin editor layout

## Batch G — Notepad tags link to client memory

**Commits:** 219d408, 5ce7ae8, 03434ed, bd8fb44, f150a21, 9535d19

### What was built

**Layer 1 — TagInput autocompleteSource:** optional prop. When provided, filters locally instead of calling `/api/tags/suggest`. Notepad passes member names + distinct tags; post tag editor unchanged.

**Layer 2 — Structured tag mapping:**
- Migration 0022 adds `notepad_entries.person_links TEXT` (JSON array of {tag, personId})
- `resolveTagPersonLinks(tags, portalId)` — member-first then people canonical_name, strict exact match, duplicate canonical_name → null + console.warn
- `addNotepadEntry` / `updateNotepadEntry` populate `person_links` on every save (re-resolve)
- Notepad page renders tags as Next.js `<Link>` to `/admin/clients/people/[id]` when personId resolves

**Layer 3 — Add-member verification:** form wired to `addMemberAction`, name + email + person lookup on blur. No code changes needed.

### Test cases

**Suggestions (browser):**
- [ ] Add member 'Calven Williams' / calven@example.com → row in portal_members with person_id
- [ ] Notepad: type 'Cal' → dropdown shows 'Calven Williams' from member list (not post-tag API)
- [ ] Type 'Cal' again after saving → still suggests, no duplicate entry
- [ ] Post tag editor (TagInput without autocompleteSource) still uses `/api/tags/suggest`

**Structured links (browser):**
- [ ] Save note with tags 'Calven Williams, Tokyo, Airbnb' → DB row has person_links JSON
- [ ] 'Calven Williams' resolves to personId, 'Tokyo'/'Airbnb' resolve to null if no people match
- [ ] Reload notepad → 'Calven Williams' renders as a link, others as plain text
- [ ] Click 'Calven Williams' link → opens `/admin/clients/people/[id]` for that person
- [ ] Edit note, remove 'Calven Williams' tag, save → person_links no longer has that entry
- [ ] Edit note, add 'Calven Williams' back, save → re-resolves, link returns
- [ ] Note with no tags → person_links is null, no crash
- [ ] Existing notes with person_links=null → all tags plain text (backward compat)

**Edge cases (browser or manual):**
- [ ] Two people named 'John Smith' → tag 'John Smith' resolves to null, console.warn logged, plain text rendered
- [ ] Tag 'Cal' (prefix, not exact) → no match, plain text (no fuzzy)
- [ ] Tag with different case 'CALVEN WILLIAMS' → resolves to same person as 'Calven Williams' (case-insensitive on canonical_name)
- [ ] Tag matching a portal member by email 'calven@example.com' → resolves to that member's personId

**Data integrity:**
- [ ] Duplicate tag 'Calven, Calven' → person_links has two entries (preserved, not deduped)
- [ ] Deleting a notepad note doesn't affect `people` rows
- [ ] Renaming a person → old tag text stays, link points to same person by ID

### Known limitations
- JSON storage, not junction table — migration to `notepad_entry_people` deferred until a cross-portal query requires it
- Existing notepad tags not backfilled to person_links (would risk typo→person mismatches)
- Person deleted after tag created → link points to 404 (person page handles gracefully if verified)
- Autocomplete doesn't include people who aren't members of this portal (only members + distinct tags)
- No remove-tag-on-member-removal — old tag text persists (intentional)

## Batch H1 — Gallery Collage Renderer

### What was built

- `types/blocks.ts` — `GalleryData` extended with optional `style`, `columns`, `aspect`, `gap`, `captionDisplay` + five type unions (`GalleryStyle`, `GalleryColumns`, `GalleryAspect`, `GalleryGap`, `GalleryCaptionDisplay`)
- `components/editor/renderers/GalleryRenderer.tsx` — full rewrite:
  - `resolveLayout(data)` — defaults kick in when a field is absent (`grid` / `3` / `landscape` / `medium` / `below`)
  - Four layout components: `GridLayout`, `MasonryLayout`, `CarouselLayout`, `HeroThenGridLayout`
  - `Caption` helper — `below` / `overlay` / `hidden`
  - `GalleryLightbox` — `<dialog>` with `showModal()`, prev/next, Esc, arrow-key navigation, click-outside to close
  - Print styles — carousel renders as grid, `break-inside: avoid` per figure, lightbox hidden
  - Mobile collapse — grid and masonry go to 2 columns at <= 640px
- Editor unchanged in H1. Layout controls land in H2.

### Test cases

**Defaults (existing galleries)**
- Open `/blog/[slug]` for a post with a gallery that has no layout fields set. Gallery renders as 3-column grid, landscape cells, medium gap, captions below. Matches pre-H1 behavior visually.
- Same gallery in admin preview popup. Identical.

**Grid**
- Set `data.style = "grid"`, `data.columns = 4` in the DB (or via admin once H2 ships). 4-column grid renders.
- Set `columns = 2`. 2-column grid.
- Shrink viewport to <= 640px. 3/4-column grids collapse to 2 columns. 2-column stays 2.

**Masonry**
- `style = "masonry"`, `columns = 3`. Three CSS columns, images keep natural aspect. Verify `break-inside: avoid` — an image is not split across columns.

**Carousel**
- `style = "carousel"`. Horizontal scroll, snap-to-item. Arrow keys / prev-next buttons navigate. Dot indicators reflect current position.
- Mobile: image width ~80% of container. Desktop: capped at 480px.

**Hero-then-grid**
- `style = "hero-then-grid"`, `columns = 3`. First image full-width, height <= 60vh. Remaining images in 3-column grid.
- Only one image in data: hero renders alone, no empty grid.

**Aspect**
- `aspect = "square"` → 1:1 cells in grid and hero-then-grid. Masonry ignores (natural).
- `aspect = "portrait"` → 3:4 cells.
- `aspect = "auto"` → natural aspect, no forced ratio.

**Gap**
- `gap = "small"` (8px), `"medium"` (16px), `"large"` (24px) — visually distinct spacing between tiles.

**Captions**
- `captionDisplay = "below"` → `<figcaption>` under each image, colored `style.bodyColor`.
- `captionDisplay = "overlay"` → white text over image bottom with gradient scrim, readable over both light and dark photos.
- `captionDisplay = "hidden"` → no visible caption, but `alt` attribute still set from `caption` (inspect DOM).

**Lightbox**
- Click any image → full-screen dialog opens with that image centered, caption below.
- Arrow keys navigate prev/next, wraps at ends.
- Prev/next buttons work.
- Close via `×` button, Esc key, or click outside the image area.
- Opening image 3 shows image 3, not image 1 (index tracking works).

**Print**
- Ctrl+P on a grid gallery — figures don't split across pages.
- Ctrl+P on a carousel gallery — carousel renders as 3-column grid on paper, no horizontal scroll, all images visible.
- Lightbox dialog hidden in print even if it was open.

**Regression**
- Gallery with images but no captions: renders correctly, no empty `<figcaption>`.
- Gallery with captions on some images but not others: per-image, no placeholder for missing.
- Empty gallery (no images): placeholder box renders as before.
- Other blocks (Hero, Image, Body, etc.) unaffected — tsc + 135 tests confirm.

### Known limitations

- **Masonry top-to-bottom flow** — CSS columns pack images vertically within each column, not left-to-right across rows. Documented trade-off; standard editorial masonry. Zero-dependency, print-safe.
- **No layout controls in admin yet** — H2 work. Until H2 ships, layout presets must be set directly via DB (`update posts set content = json_set(content, ...)` or admin once controls exist). This is why H1 is renderer-only: Myah can't exercise the new layouts from the UI until H2 lands.
- **Lightbox `<dialog>` styling** — native dialog styling varies slightly by browser. Current inline styles force full-viewport dark overlay, but browser version differences may show minor differences (focus ring color, backdrop opacity).
- **No image dimension metadata** — masonry relies on `height: auto` and natural image load. Very tall or very wide images may cause column imbalance; acceptable for the use case.
- **Carousel scrollbar** — `scrollbarWidth: thin` is Firefox; Chromium ignores it. Chromium may show a standard scrollbar under the carousel. Acceptable.

## Batch H2 — Gallery Collage Editor

### What was built

- `components/editor/blocks/GalleryBlockEditor.tsx` — full rewrite (~434 lines):
  - **Layout controls header** — Style / Columns / Aspect / Gap / Captions dropdowns, wired to `onChange`, live preview. Columns visible for grid/masonry/hero-then-grid. Aspect visible for grid/hero-then-grid only.
  - **Bulk upload zone** — dashed drop target + click-to-browse, `<input type="file" multiple accept="image/*">`, drag-over highlight, sequential POST to `/api/upload`, client-side 10MB check (matches `lib/media` `MAX_IMAGE_SIZE`), progress "Uploading N of M...", partial failures listed inline, URL conversion matching `ImageSourcePicker` (`/uploads/` prefix).
  - **Thumbnail strip** — 60×60 previews, up/down arrow buttons per thumbnail (matching `PortalItemsList` pattern — no drag, arrows only), × remove, focused thumbnail ring-highlight.
  - **Per-image detail collapse** — only the focused image expands the full `ImageSourcePicker` + caption input. Close button, remove, focus tracking survives reorder.
  - **`+ Add Image`** — appends blank slot and auto-focuses it.
  - **`focusedIndex`-aware `removeImage`** — removing an image adjusts focus correctly (clears if removing focused, decrements if removing a lower-indexed image).

- Existing behaviors preserved: per-image `ImageSourcePicker`, per-image caption input, `+ Add Image`, remove. All of it now reachable only via focused slot.

### Test cases

**Layout controls**
- Open a gallery block editor. Five dropdowns visible: Style, Columns, Aspect, Gap, Captions.
- Change Style to `masonry`. Columns stays visible. Aspect disappears (masonry uses natural aspect).
- Change Style to `carousel`. Both Columns and Aspect disappear.
- Change Style to `hero-then-grid`. Both reappear.
- Change each control — preview pane (or popup preview) updates within ~150ms of the change.
- Save post, reload, reopen editor — all five settings persist.

**Bulk upload**
- Click the drop zone. File picker opens with multi-select. Pick 5 images. All 5 upload sequentially ("Uploading 1 of 5..." through "5 of 5"). 5 thumbnails appear in the strip in file-order. All 5 expanded slots collapse (only the strip is populated, no detail auto-opens).
- Drag 3 images from Explorer/Finder onto the drop zone. Same behavior — all 3 upload, thumbnails appear, drop zone highlights during drag-over.
- Drop 3 images where one is 15MB. That one listed under "Failed: file.jpg (exceeds 10MB)". Other two upload successfully. No POST attempted for the oversized file.
- Drop 3 images where one is a valid size but the server rejects (simulate by stopping the API or making a folder permission issue). Other two upload, that one listed as "(server rejected)".
- Drop 3 images, kill network after first upload. First uploads, other two listed as "(network error)" or "server rejected". Partial success.
- Single image upload still works — one file, one thumbnail.

**Thumbnail strip**
- Click the ↑ arrow on thumbnail 2. Swaps with thumbnail 1. Focus (if any) follows.
- Click the ↑ arrow on thumbnail 1. Disabled (button is `disabled={i === 0}`), no change.
- Click the ↓ arrow on the last thumbnail. Disabled, no change.
- Click a thumbnail image. That image's detail section expands below. Other images' details stay collapsed.
- Click a different thumbnail. Detail swaps to the new image.
- Click × on a thumbnail. Image removed, remaining images shift, focus adjusts (clears if removing focused, moves if removing a lower-indexed one).
- With 4 images, remove image 1 (while image 3 is focused). Focus should now be on what was image 3 → now index 1. Verify by clicking the new index-1 thumbnail — it should already be focused (ring visible), not require re-click.

**Per-image detail**
- Click thumbnail. Detail expands showing ImageSourcePicker, caption input, Image N header, Remove, Close.
- Replace the image URL via ImageSourcePicker. Thumbnail updates live.
- Change caption. Thumbnail's `alt` updates (inspect DOM), preview caption updates.
- Click Close. Detail collapses. Thumbnail stays in strip.
- Click ↑/↓ while detail is open on the moved image. Detail follows the move.
- + Add Image. New blank slot appears in strip (with `+` placeholder if no URL). Detail auto-opens on the new slot.

**Persistence**
- Set all 5 layout fields to non-default values. Add 4 images, reorder them. Save post. Reload edit page. All 5 fields persist, order persists, thumbnails persist.
- Publish post. View on `/blog/[slug]`. Gallery renders with the chosen layout (verify against each style: grid, masonry, carousel, hero-then-grid).
- Existing gallery with no layout fields. Open editor. All dropdowns show defaults (grid/3/landscape/medium/below). No visible change to the editor layout. Save without touching layout. Existing render unchanged.

**Integration**
- Gallery with 0 images. Editor shows "No images yet. Drop files above or click + Add Image." Bulk zone visible. Add 1 image via `+ Add Image` — auto-focuses. Drop 2 images — all 3 thumbnails present.
- Gallery with 1 image. Up/down arrows on the single thumbnail are both disabled.
- Very long captions — detail input accepts, thumbnail `alt` accepts, renderer truncates/wraps per style.
- Popup preview open while editing. All changes (layout, images, captions) reflect in the popup within ~150ms.

### Known limitations

- **No drag reorder** — up/down arrows only, matching `PortalItemsList`. Plan originally specified HTML5 drag; dropped in H2 because (a) `PortalItemsList` doesn't use drag, (b) arrows work on touch, (c) drag adds ambiguity around drop-targets and reorder-during-upload. If drag is wanted later, it's an additive change to `ThumbnailStrip` without touching the rest of the editor.
- **Sequential upload only** — files upload one at a time (progress "N of M"). Plan considered parallel `Promise.all`; sequential chosen for cleaner progress, simpler error handling, gentler on the server. Bulk-uploading 20 images at ~1s each = 20s total. Acceptable for a single-admin tool.
- **No image reordering inside detail view** — only via strip arrows. The detail shows the image but no up/down for convenience. Deliberate; strip is the reorder surface.
- **Detail panel expands below the strip, not inline** — scrolls the strip out of view on a long gallery. Plan mentioned "click scrolls to its detail slot"; not implemented. If a gallery has 20+ images, clicking a thumbnail far down the strip may require scrolling to reach the detail. Acceptable for typical galleries (5–15 images).
- **Bulk upload progress loses context on tab switch** — if the admin navigates away mid-upload, in-flight POSTs may complete server-side but the strip won't show them. Re-open the block to re-fetch (existing block data). No cross-tab coordination — same limitation as other autosave features.

## Batch I — Media Library Picker

### What was built

- `drizzle/schema/media.ts` — `is_library` column ({ mode: "boolean" }) + `idx_media_library` index
- `drizzle/migrations` — `is_library` migration (applied directly to `data/site.db`; migration file not yet added to `drizzle/migrations/`)
- `lib/media/index.ts` — `addMediaRecord` accepts `isLibrary?: boolean`
- `lib/media/url.ts` — `buildPublicUrl(filePath)` helper
- `app/api/media/route.ts` — `GET /api/media` (scope=library|all, search, pagination, server-capped limit 48, LIKE escaping for `\`, `%`, `_`, total from separate count query)
- `app/api/media/[id]/route.ts` — `PATCH /api/media/:id` (strict boolean validation, 400 on invalid id/JSON, 404 on missing/soft-deleted)
- `app/api/upload/route.ts` — reads `isLibrary` form field (literal `"true"` only)
- `components/editor/MediaLibraryPicker.tsx` — new modal (Saved/All tabs, search, star-to-promote, load-more, `<dialog>` primitive, backdrop close, `close` event sync, `AbortController` on search, `offset = items.length` pagination, first-open auto-switch when Saved empty, hint in All view, "N saved" count in header)
- `components/editor/ImageSourcePicker.tsx` — third mode "From library", `buildPublicUrl` use, "Save to library" checkbox (default OFF, `localStorage` key `imagePicker:saveToLibrary`)

### Test cases

**API — list**
- `GET /api/media?scope=all` → 36 items (Codespace), `total: 36`
- `GET /api/media?scope=library` → `{ items: [], total: 0 }` before starring
- `GET /api/media?scope=all&q=Screenshot` → filename substring, case-insensitive
- `GET /api/media?q=%` → literal `%` match, not wildcard
- `GET /api/media?q=_` → literal `_` match
- `GET /api/media?limit=999` → capped at 48 items
- `GET /api/media?scope=all&offset=24` → next page, no overlap with page 1

**API — promote**
- `PATCH /api/media/1` `{ isLibrary: true }` → 200 `{ id: 1, isLibrary: true }`
- `PATCH /api/media/1` `{ isLibrary: "true" }` → 400 `{ error: "isLibrary must be a boolean" }`
- `PATCH /api/media/1` `{ isLibrary: 1 }` → 400 (number, not boolean)
- `PATCH /api/media/abc` → 400 invalid id
- `PATCH /api/media/99999` `{ isLibrary: true }` → 404 not found
- `PATCH /api/media/1` invalid JSON body → 400

**API — upload**
- `POST /api/upload` with `isLibrary=true` → new row `is_library = 1`
- `POST /api/upload` with `isLibrary=false` → `is_library = 0`
- `POST /api/upload` with `isLibrary=yes` → `is_library = 0` (only literal `"true"` counts)
- `POST /api/upload` with no `isLibrary` → `is_library = 0`

**ImageSourcePicker — third mode (browser)**
- Hero block editor: three tabs visible — Upload from PC / Paste URL / From library
- Click "From library" → "Browse library" button appears
- Click "Browse library" → modal opens with Saved tab default (if library has items) or All uploads + hint (if empty)
- Image block editor: same behavior
- Gallery per-image detail: same behavior, selecting sets that slot's image

**MediaLibraryPicker — modal (browser)**
- Saved tab lists only `is_library = 1` files
- All uploads tab lists everything (including unsaved)
- "N saved" count in header reflects actual library count
- Star a tile in All uploads → becomes yellow-filled, count increments
- Unstar a tile in Saved → removed from Saved view on next load
- Click a tile body → selects, `onChange` fires with `/uploads/<filePath>`, modal closes
- Star click does not trigger selection (only toggles star)
- Search by filename filters both tabs
- Search debounces 300ms
- Load more appends next page (24 per)
- Escape key closes modal
- Click outside grid closes modal
- × button closes modal
- Missing file (404 on `/uploads/<path>`) — image hidden via `onError`, tile still selectable
- First open when Saved is empty → auto-switches to All uploads, hint visible
- After starring one tile, switching to Saved shows it

**Upload checkbox (browser)**
- Upload mode: checkbox "Save to library" visible, unchecked by default (fresh browser)
- Tick checkbox, upload file → file appears in Saved view of library modal
- Untick checkbox, upload file → file only in All uploads
- Reload page, tick state persists (localStorage `imagePicker:saveToLibrary`)
- Clear localStorage → checkbox defaults to unchecked on next mount
- Private browsing / localStorage disabled → checkbox defaults unchecked, upload still works (no throw)

**Persistence (browser)**
- Upload with checkbox ticked, save post, reload edit page → image persists in block AND appears in Saved library view
- Select from library, save post, reload → URL persists in block
- Publish post, view on `/blog/[slug]` → image renders correctly

**Regression**
- Existing posts with gallery/hero/image blocks render identically (renderers untouched)
- Paste URL mode unchanged
- Existing "Choose image" upload mode without checkbox interaction still works (defaults to `is_library = 0`)
- Portal wall loads (content_library untouched)
- `/admin/media` page still lists files (unchanged in Batch I)
- `tsc --noEmit` clean
- `npm test` still 135 passing

### Known limitations

- **No admin UI for library yet.** Picker browses and stars, but managing/organizing library files is Batch J. Admin `/admin/media` is unchanged.
- **No folders.** Files are flat. Nested folders are Batch J.
- **No thumbnail generation.** Full-size images (1920px max) load in the grid. First page of 24 could pull ~24MB worst-case. Batch J candidate.
- **No multi-select in picker.** Single image per picker call. Gallery requires one modal open per slot. Batch J candidate.
- **Auth is a dev gate.** `requireAuth()` returns first user when `DISABLE_AUTH=true` in dev, throws otherwise. Real session-based auth is Phase 7.7. The two new endpoints (`GET /api/media`, `PATCH /api/media/:id`) will inherit whatever `requireAuth()` becomes at launch.
- **No reference tracking.** Deleting a `media` row via `/admin/media` (which is possible today) still breaks any post referencing that URL. Starring makes files feel permanent but they aren't. Batch J candidate.

