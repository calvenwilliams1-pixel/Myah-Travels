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
