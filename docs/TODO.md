# MyCalTravels — TODO.md (Revision 38)

## Status

**All planned phases (7.6, 7.8, 7.9, 9, 9.5) are CODE-COMPLETE and the site is LIVE** — launched Nov 22, 2026 at https://stgeammachine.tail2ba8aa.ts.net (Tailscale Funnel on the mini PC, Gmail SMTP). 184 vitest tests passing, `tsc` clean. Revisions 21–22 (Nov 23, 2026) reconcile this file against the code, the live deployment, and the owner's dispositions — several items earlier revisions listed as pending had in fact shipped; they are now marked done, and the genuinely remaining work is collected under "What's left" below.

**UI Style Plan — BUILT, awaiting preview approval (Nov 23, 2026).** The plan (goal files, `UI_Style_Plan_2026-11-23.md`, Rev 5 after four review rounds) is implemented in PRs #25–#29 and deployed to the PREVIEW only (Step 0: a full second copy on the mini PC at tailnet-only :8443 with its own DB/uploads copies, dummy SMTP, and no crons; login over HTTPS proven). Pass 1a: font pairings via next/font (A: Playfair Display + Inter, B: Fraunces + Source Sans 3 — flip is one CSS line in globals.css), type tokens, card/section/button tokens, public contrast floor, hero standard. Pass 1b: welcome templates (banner/overlay/split) behind a reversible `welcome_mode` setting with starter-shape auto-carry of the existing canvas content; the canvas editor remains available. Pass 2a: portal contrast sweep, palette pairings module with an automated WCAG contrast test (27 tests; pairings drive itinerary headings/small text/bands), cover header on the itinerary view, one `.day-card` language across views. Pass 2b: print rules (color-adjust exact, cover page, section/day breaks) verified mechanically with print-emulated PDFs. Pass 3: `.form-control` token consumed by the shared Input, sticky section headers in the itinerary editor (measured `--admin-header-h` offset), admin gray-400 → gray-500 sweep (35 uses), dashboard/content cards verified on the shared Card system. 290 vitest tests passing. **Promotion to production is pending:** (1) the Step 0 phone gate — Tailscale on Myah's phone, node share/ACL limited to the preview port, her login, and the negative test; (2) Myah's approval of the preview. One plan item deferred: Pass 2a palette expansion waits on D3 — which trips Myah actually sells. Production still runs the Phase 8 code (PR #24).

**Type overhaul, part 1 — templates ARE the post types (Nov 23, 2026, PR #32, preview).** The owner's call: "guides" and "reviews" were placeholder names from the original design that got baked into the core; they are gone as content types. A post's template is its type now. The feed is posts-only (`lib/feed` rewritten; the `?type=` param is a template slug matched against the templateId stored in each post's content JSON); homepage filter pills are **All + one per template that has at least one published post** (the owner's rule: a filter appears when the template's first post is published, never as an empty shelf), supplied by `getFeedTemplateFilters()`; feed cards badge the template's name and link to /blog. The guides/reviews public and admin routes are retired as redirects (production never had guide/review content — verified zero rows — so nothing was migrated; the tables and lib/content helpers remain in place, inert). The admin sidebar no longer lists Guides/Reviews. 300 vitest tests passing. **Part 2 (PR #33, preview) completes the overhaul and the template-maker audit's fix:** the post editor gained "Save as template" — it snapshots the current arrangement as `layout` (ordered block types, duplicates included; `lib/blocks/layout.ts` derives the rules layer from it) — and applying a template with a layout now places the full saved arrangement in order instead of only the required blocks (click-verified end to end: Title → Hero → Body → Quote → Body recalled exactly). The Template Creator shows a saved layout and carries it through edits untouched. The three dead canvas-format post seeds are removed from `scripts/seed.ts`, and the in-site guide no longer mentions guides/reviews. 306 vitest tests passing.

**Portal entry fixes — themed portal tree, public redirects, styled access page (Nov 23, 2026).** Found by Cal opening his own promo link on his phone: (1) The whole portal tree sat outside ThemeProvider, so themed components had no CSS variables — the access page's Continue button was white text on a transparent background (invisible). A new `app/portal/layout.tsx` wraps the portal tree in ThemeProvider, fixing every themed element there at once (itinerary accent fallbacks included). (2) The consume and logout routes built redirects from the request URL, whose origin behind the Tailscale Funnel is the internal localhost:3000 — clients were redirected to "localhost" on their own device. Redirects now use `getPublicBaseUrl` (SITE_URL when set, request origin otherwise; unit-tested). (3) The access page itself was a bare white card: it now shows the portal's banner (its own hero image, else the site welcome photo — same image as the invite email), the portal's name and subtitle, and a full-width Continue button, with a line telling clients the link can be re-opened any time. Lesson recorded: browser-automation clicks find DOM nodes even when they're visually invisible — portal verification now includes looking at the rendered page from the public URL.

**Magic-link fixes — reusable links + site-colour emails (Nov 23, 2026).** Found by Cal clicking his own test email: (1) Magic links were effectively single-use — `validateMagicLink` required `usedAt IS NULL`, so re-opening the same email link (another browser, a mail-app handoff, months later) said "expired or invalid." That broke the promo portal's whole premise ("save this link and come back any time"). Links are now reusable until they expire or are revoked; `usedAt` only records first use. Regression-tested (validate + consume twice). (2) The magic-link email's green was a hardcoded constant that merely matched the site; `sendMagicLinkToMember` now reads `primary_color` from settings and the email wears the site's current colour (hex-validated, default as fallback), so re-theming the site re-themes the email. The shell's outer background went neutral so any palette sits well on it. The other emails still use the shared template's fixed colour — same treatment available if wanted.

**Magic-link email redesign (Nov 23, 2026).** The portal access email (`magicLinkEmail`) has its own shell now instead of the shared base template: a brand-green bar with the site wordmark, the welcome photo as a full-width hero, a "Your portal is ready" eyebrow with the portal name as a serif headline, a pill Access Portal button, a copy-paste fallback link under the button, and a footer linking Myah's Instagram and YouTube. The promo variant's body copy speaks to prospects (sample itineraries, ideas and offers) and keeps the "doesn't expire" line; trip portals keep their expiry date line. The other emails (password reset, etc.) still use the shared base template. If a mail client blocks the hero image, the layout still reads cleanly.

**Promo portal — a permanent portal for potential clients (Nov 23, 2026).** One standing portal (`portals.is_promo`, migration 0035) that works exactly like a trip portal — documents, notices, FAQs, a sample/mock itinerary built with the normal builder — but is meant for prospective clients rather than a booked group. Differences: `getMagicLinkExpiry` returns a date a century out for promo portals (checked before the return date, so it holds even if dates are ever set), and portal sessions inherit the same expiry because `consumeMagicLink` now routes through that one helper; the daily purge job skips promo portals outright; the invite email says "This link doesn't expire" instead of naming a date (`magicLinkEmail` takes a null label). Created from a dedicated card on the admin portals page (`createPromoPortal` — idempotent, only one can exist; default name "Explore Travel With Me", renameable like any portal). Members are added by email alone (name was already optional in the add-member flow), and the magic link is emailed on add as usual. The portals list badges it "Promo"; its admin page replaces the departure/return line with a permanence note. 321 vitest tests passing (new: expiry rules + email wording).

**Deals band — auto-synced agency promos (Nov 23, 2026).** Myah's feedback: visitors are customers wanting to buy, so the homepage now carries a **Featured Deals** band under the welcome section (`components/homepage/PromoDeals.tsx`): the current promo flyers from her TTAND storefront (dslaptravel.com), first deal as a large hero card, the rest in a grid; every picture is the button and clicks out to that offer on the storefront, where booking happens. Flyer images render `object-contain` (never cropped — the offer text is baked into the artwork). The band is fed by a `promo_deals` settings JSON validated by `lib/promos.ts` (strict https {image, href, title} shape, cap 8; a bad sync can shrink the band but never break the page), and renders nothing when empty. **Keeping it current:** the storefront sits behind a Vercel bot checkpoint that turns away plain HTTP clients (verified 429 on every path from both the VM and the mini PC; no public TTAND API exists for pulling offers out), so a script on the mini PC (`~/promo-sync/sync-promos.js`, Playwright + a persistent real-Chromium profile) visits the storefront like a person, harvests the linked offer flyers (real `/offer/` pages first, category tiles excluded, titles from card headings or humanized slugs), and writes the setting — daily via cron, and runnable by hand any time. A run that finds nothing exits non-zero and leaves the database untouched, so the site keeps showing the last good set. If TTAND ever offers agents an official feed/widget, only the script's source changes; the site side stays as is.

**Per-post social links + footer accounts (Nov 23, 2026).** A post can now carry a companion Instagram post link and YouTube video link (`posts.instagram_url` / `posts.youtube_url`, migration 0034, additive). Both post forms (new + edit, incl. autosave snapshots) have the two fields; the admin actions validate them through `lib/social.ts` (`cleanSocialUrl` — right platform, real YouTube video id required — with plain-language errors; `youtubeVideoId` parses watch/youtu.be/shorts/embed/live). The public post page renders a `PostSocialLinks` section under the article: the YouTube video plays inline via a youtube-nocookie embed, and Instagram is a link card (their embeds are unreliable without their script). The footer's Connect links now point at Myah's real accounts — `instagram_url` = https://www.instagram.com/mycaltravels, `youtube_url` = https://youtube.com/@mycaltravels (settings, set Nov 23, 2026; editable any time in Settings). 312 vitest tests passing.

**Font choices — D1 RESOLVED as settings, not a pick (Nov 23, 2026, PR #31, preview).** The owner replaced the one-time font pick with choices Myah controls: six curated pairings in `lib/theme/font-pairings.ts` (Classic/Warm/Modern/Storybook/Luxury/Bold), a Font Style picker in Settings beside the palettes (saving also revalidates the public layout, so brand changes apply immediately instead of at the ISR rollover), and a per-itinerary font selector in the builder (`itineraries.font_pairing`, migration 0033; NULL = site font) that applies to the published itinerary view, glance, and Today's Plan and can be changed any time after publishing. 296 vitest tests passing. Migration 0033 must be applied to the production DB at promotion time (additive ALTER TABLE).

**Batch M (auth + onboarding) SHIPPED on `main`** — merged at `60420df`. User flags (`is_admin`, `is_active`, `must_change_password`, `has_completed_setup`), `seed-admin.ts` CLI, `requireAuth`/`requireSession`/`requireAdmin` split, 3-step setup wizard, cache bug fix, dashboard warmth, `next start -H 127.0.0.1` bind, `auth-rate-limit.sh` audit suite.

**Batch H1 (Gallery Collage renderer) shipped. Batch I (Media Library Picker) shipped. Batch J (admin library page + folders) shipped.** Verified in code this session — this TODO was lagging behind those commits.

**Itinerary Client Experience (Glance + Today's Plan) SHIPPED.** Verified in code this session: `lib/itineraries/derive.ts` (`deriveGlance` + `deriveDayByDay`), `components/portal/glance/ItineraryGlanceView.tsx`, `attachDerivedItems()`, `PortalWall.tsx` renders both variants, 3 test files. Migration `0019_itinerary_timezone.sql` applied. **This TODO's "SPECCED — not built" claim was stale — the code exists.**

**Tag System milestone COMPLETE on `feat/blog-system`** (branched from `main` at `60420df`). 9 commits: 2a through 2e-3. Ready to merge to `main`. 179 vitest tests passing.

### Tag System Milestone ✅ COMPLETE on `feat/blog-system`

- **2a — tag chips on feed cards** ✅ `61d6651`
  - `FeedTag` type, `tags: FeedTag[]` on `FeedItem`, batched hydration (3 queries, no N+1), chips below excerpt on `FeedCard`
- **2b — URL-driven tag filtering** ✅ `56a0df9`
  - `?tags=a,b` with AND semantics. Feed filters row: top 20 by usage + Show all + Clear. Empty state differentiates.
- **2c — tag integrity + admin UX** ✅ `f95907f`
  - All 7 tag write functions wrapped in `db.transaction()`. `mergeTags` repoints all three junction tables. `deleteTag` checks all three. `getAllTagsWithCounts` uses per-junction subqueries, excludes drafts. Admin actions surface errors. `<details>` confirmations. Banners render.
- **2d — guide/review editor tagging** ✅ `3d772f9` (browser verified after)
  - `TagInput` added to guide/review edit forms. `getGuideTags`/`getReviewTags`/`updateGuideTags`/`updateReviewTags` in `lib/content`. Cross-type filtering works.
- **2e-1 — flat alias schema + lib + tests** ✅ `f0b265e`
  - Migration `0028_tag_aliases.sql`. `lib/tags/aliases.ts` (7 functions). 14 tests.
- **2e-1b — constraint hardening** ✅ `0373c97`
  - Migration `0029_aliases_constraints.sql`. `canonical_tag_id ON DELETE RESTRICT` (was CASCADE). 4 triggers enforce flat model at DB level. 6 new tests.
- **2e-2 — alias-aware filtering** ✅ `a141dee`
  - `EXISTS` per family in `buildSelect`. Families resolved once at top of `getFeedItems`, deduped. 5 tests.
- **2e-3 — admin alias management UI** ✅ `7c092fc`
  - `getAliasMap()` for one-query lookup. Alias column with add/remove controls. `deleteTagAction` uses `deleteCanonicalSafe`, `mergeTagsAction` uses `mergeTagsWithAliases`. `addAliasAction` + `removeAliasAction` new. Simplified UI (one intent per row).
- **Merge `feat/blog-system` → `main`** ✅ merged Nov 22, 2026 (PR #3)

### Post-milestone polish (pending)

- **2e-4 — favourite tag improvement** ✅ DONE (verified in code Nov 23, 2026)
  - `getTagSuggestions` returns favourite tags (up to 10) on an empty query instead of `[]`, and sorts favourites above recency in non-empty results.

### Open security items (from this session)

- **Japan itinerary PDF in the repo** — CLOSED (Nov 23, 2026): no uploads are tracked on `main` anymore, and the owner confirmed the file was test data. It existed in git history, but as test data no history cleanup is needed.
- **`public/uploads/` in `.gitignore`** ✅ FIXED — `public/uploads/*` + `!public/uploads/.gitkeep` (and the same for `data/uploads/`) are in `.gitignore`.
- **Uploads serving after `next build`** ✅ RESOLVED by design — uploads are served through the authenticated route handler `app/api/uploads/[...path]`, not from `public/`, so files added after a build serve correctly.

### Outstanding from earlier sessions (still open)

- **Rate-limit FINDINGs** from `auth-rate-limit.sh` — ✅ **FIXED Nov 23, 2026.** (1) A proven password now resets both login counters; (2)+(3) the login route also applies a per-username limiter (10 attempts / 15 min accumulated across all IPs), which is the distributed-guessing defense. Unit-tested in `lib/security/rate-limit.test.ts`; the audit suite gained a distributed-guessing section.
- **PreviewPopout bounds clamping** — Bug #1. ✅ Verified SHIPPED Nov 23, 2026 (`clampPosition`/`clampSize` in `PreviewPopout.tsx`, applied on mount and drag). Closed.
- **Body block Tab handler** — Bug #2. ✅ Verified SHIPPED Nov 23, 2026 (`sinkListItem`/`liftListItem` handler in `TipTapEditor.tsx`). Closed.
- **Gallery block upload** — Bug #3. Batch A shipped (Gallery block reuses `ImageSourcePicker`). Closed.

**Phase 7.6.8 (Notepad tag behaviour) is REJECTED** — see its section below for rationale. Not deferred, not scheduled.

**Upcoming after tag milestone:** Phase 7.7 Launch Day — ✅ COMPLETE Nov 22, 2026 (see the Phase 7.7 section note for the route actually taken). Phase 7.3 sweep — ✅ COMPLETE: Publish Validation, Error Boundaries per block, and Responsive Preview all shipped in Batch F. Phase 8 (social publishing) deferred to post-launch.

## What's left (as of Nov 23, 2026)

Shipped since launch, for the record: full mobile/tablet pass (PR #5), post-launch audit fixes — seed password guard, reusable magic links, draft recovery, post-editor autosave (PR #6), trusted-device 2FA (PR #7), security headers (PR #8), homepage welcome wiring (PR #9), dashboard greetings (PR #10), in-site Getting Started guide (PR #11), forgot-password reset flow (PR #12). 184/184 tests passing.

Not tracked here: **Myah's first login + authenticator enrolment** — her own step, not project work. The account is ready (forced password change ON, verified Nov 23, 2026).

Still open, small:

1. **SSH key-only login on the mini PC** — password authentication still enabled. Owner's call.
2. **TESTING.md checklists** — the features themselves were fully tested at launch (launch test report + post-launch audit; 184 automated tests). Only the written manual checklists for a few areas (blocks beyond Body, client-facing rendering, Content Library) were never added. Documentation debt only.

Held in reserve:

- **Framework upgrade (Next / drizzle / sharp)** — only if a future bug actually traces to the current versions. Not a standing task and not a priority.
- **Off-disk backups** — genuinely good advice, not a priority: nightly backups (`~/backup-site.sh`) currently land on the same 2TB disk as the site itself.

Closed Nov 23, 2026:

- **Rate-limit findings (3)** — per-username login limiter added (10 / 15 min across all IPs) and a proven password now resets both login counters.
- **Timezone unification (owner-requested audit)** — one pure date/wall-clock module now backs all leg math (the portal's duplicated copies are deleted; the old local-parse/UTC-readback mix made "+1 day" badges depend on the machine's timezone); the timezone picker is generated from the platform tz database and covers all 327 airport-catalog zones (was 80); leg timezones auto-fill from the airport catalog on suggestion pick and on booking paste; new itineraries default to America/Toronto instead of the UTC fallback; section extension uses calendar math in the section's own timezone.
- **Phase 8 itinerary builder — COMPLETE (Batches 1–5)** — Batch 1 (PR #20): stay kinds hotel/resort/cruise, each form asking only what the kind needs; cruise line/ship and resort brand picked from the Batch 0 catalogs (picking a ship fills its line; ships never land in the hotel memory). Batch 2 (PR #21): "Lay out sailing days" builds/retitles a cruise section's days from a typed port list; re-laying never touches segments already added. Batch 5 (PR #22): trip summary strip ("3 nights Toronto · 7 nights aboard Symphony of the Seas · 2 nights Cancún resort"), Glance names the ship on cruise nights, Today's Plan is port-aware ("Day 6 — Cozumel" / "Day at sea"), sea days get the calm treatment. Batch 4 (PR #23): advisory trip-check panel in the editor (never blocks saving) — stays outside section dates, overlapping stays, nights with no stay plus a per-section nights-accounted line, and flight legs whose times break once timezones are counted. Batch 3 (PR #24): booking-paste grew a generic any-airline flight parser (dates/times now extracted for every parser; arrival rolls to the next day when the clock says so), a cruise parser (ship/line/cabin/deck/dates/Day-N port lines), catalog resolution for unknown airline codes and parsed ships, and a paste box on the Add Stay form whose parsed port list is stored on the stay and prefills the sailing-days layout. D2 note: parsers are catalog-driven rather than tuned to specific senders; real sample confirmations from Myah would sharpen them further. 252 vitest tests passing.
- **Phase 7.5 demo content** — the Japan/Cruise/Singapore seeds were test scaffolding, not product work. Dropped.
- **Japan PDF history question** — the file was test data (owner confirmed). No history cleanup needed. Closed.

**Phase 8 — shelved, now SCOPED (Nov 23, 2026), awaiting the owner's decisions and go-ahead.** The itinerary-builder scope lives in the goal files (`Itinerary_Builder_Scope_2026-11-23.md`): six batches — a reference-data backfill first (airports/airlines widened from the current 64/45 starter sets, a new curated cruise lines + ships catalog, resort brands), then stay kinds (hotel/resort/cruise), generated sailing days, wider booking-paste coverage, trip-check accuracy warnings, and mixed-trip output polish — under the owner's goals (save data-entry time, extra care for accuracy, simplicity, an attractive finished product) and the one-trip-one-itinerary rule. **Batch 0 SHIPPED Nov 23, 2026:** airports 64 → 4,571 (every one with an IANA timezone), airlines 45 → 992, new curated cruise catalog (29 lines, 275 ships) and resort brands (43), all served by the suggestions API under new stay field keys; airport/airline search now ranks exact code matches first. The regeneration script also gained an offline mode and a fix for its airline parser, which had never actually parsed upstream rows. **Batches 1–5 SHIPPED Nov 23, 2026 (PRs #20–#24)** — see the "Phase 8 itinerary builder — COMPLETE" entry under Closed above. The owner's decisions (D1 cruise as a stay kind with generated days, D3 resort = meal plan + transfers, D4 per-client cabins out) were followed; D2 (which confirmations Myah actually receives) was answered by building catalog-driven generic parsers instead of per-sender ones, tunable later with real samples. The other Phase 8 notes below (People table, portal enhancements) remain separate, unscoped ideas.

## Core Principle

Developer controls design. Template controls layout. Writer controls content. Settings control brand. System controls hierarchy.

---

## Locked Decisions

### APPROVED
- Template System (structural only)
- Block Registry (10 blocks for posts)
- Block Editors + Renderers (switch-based)
- Live Preview (sticky split screen)
- Semantic theme tokens (primary, secondary, accent, success, warning, danger, info)
- Curated colour palettes (6 pre-validated)
- Fixed white background
- Status colours fixed
- Content Library (create once, reuse everywhere)
- Portal Wall (client-facing)
- Admin Preview (bypass magic link)
- Hero Banner with 8 named presets
- Itinerary as `portal_items` (unified pipeline)
- Flights = Travel segments
- Notepad is admin-only
- Print stylesheet for itinerary export
- Empty days render placeholder
- Autosave hook with durability layer (localStorage draft persistence)
- Form primitives (AutosaveTextField, AutosaveDateField, AutosaveTimeField, AutosaveSelectField)
- Inline forms replace `prompt()` dialogs
- Test framework: vitest + testing library (143 tests)
- Itinerary client views (Glance, Today's Plan) derive from itinerary data — no authoring surface
- Account management is CLI-only via `scripts/seed-admin.ts` (M.6 Users page dropped — fine for single-admin + dev; revisit if selling deployments)
- `requireAuth` (strict) vs `requireSession` (loose for wizard) — see `docs/ACCOUNT-LIFECYCLE.md`

### REJECTED
- CanvasElement for writers
- Moveable for writers
- Drag-anywhere layout
- Shape editors / border controls / property panels
- General-purpose design tools
- Full colour customisation
- Free-form background colour picker
- Brand-aware dark mode
- Standalone Itinerary data source
- Itinerary PDF pipeline
- Options segments in V1
- Cruise mode in V1
- People table in V1
- Notepad cross-portal sharing
- Merging data sources on the wall
- Notices feature
- TagInput post-tag backend coupling
- **Phase 7.6.8 Notepad tag auto-populate** (see decision section below)

---

## Phase Status

| Phase | Status | What |
|-------|--------|------|
| 1-5 | ✅ Complete | Block foundation through Portal V1 |
| 6.1-6.4D | ✅ Complete | Quick wins, Itinerary V1, Notepad, Autosave + form primitives |
| 7 | ✅ Complete | All 6 bug-fix batches |
| 7.5 | Partial | Singapore Demo seeded; Japan+Cruise+Singapore pending |
| 7.6 | ✅ Complete | Waves 1-4 complete; 7.6.8 rejected (see below) |
| 7.8 | ✅ Complete | Data Entry Automation (suggestions, duplication, drag-reorder, bulk-add, snippets, paste-booking, stale entities, kill switch) |
| 7.9 | ✅ Complete | Post Editor and Writing Tools (toolbar, colour presets, pop-out preview, YouTube embed, social handles) |
| 9 | ✅ Complete | Client Memory System (people, notes, trip history, portal purge, itinerary library) |
| 9.5 | ✅ Complete | Polish Pass + Security Audit |
| Itinerary Client Experience | ✅ Complete | Glance + Today's Plan card — derived from itinerary data, no authoring surface |
| **Batch M** | **✅ SHIPPED on `main`** | **Auth + onboarding: user flags, seed-admin CLI, requireAuth split, 3-step wizard, cache bug fix, dashboard warmth, localhost bind, auth-rate-limit audit suite. Merged at `60420df`.** |
| **Batch build** | ✅ Complete | H1 (Gallery Collage) shipped, I (Media Library Picker) shipped, J (admin library + folders) shipped |
| **Tag System** | **✅ Complete on `main`** | **2a-2e-4 shipped. Merged to main Nov 22, 2026 (PR #3).** |
| 7.3 | ✅ Complete | Sweep done; the three survivors shipped in Batch F |
| 7.7 | ✅ Complete | Launch Day — launched Nov 22, 2026 (Tailscale Funnel + Gmail SMTP; see Phase 7.7 note) |
| 8 | ⏳ Future | Options segments, cruise mode, People table — post-launch |

---

## Batch Plan

Build order, then testing pass. Every batch updates `docs/TESTING.md` with its test cases before commit. Every batch is a heredoc, verified, committed, pushed.

### Round 1 — Three outstanding bugs (all SHIPPED)

**Batch A — Gallery block reuses ImageSourcePicker**
- Swap Gallery's URL-only inputs for `ImageSourcePicker` per slot
- Match wiring from `HeroBlockEditor` and `ImageBlockEditor`
- No schema/API changes
- Append TESTING.md section: upload from PC, paste URL, library picker, add/remove slots, render on `/blog/[slug]`, print behaviour

**Batch B — Body editor Tab handler**
- Tab → `sinkListItem("listItem")` when in a list, `preventDefault()` otherwise
- Shift+Tab → `liftListItem("listItem")` when in a list
- Handler in `TipTapEditor` (editor-only, not renderer-relevant; `buildExtensions` untouched)
- Append TESTING.md section: indent/outdent, Tab outside list does nothing, Tab doesn't escape editor, nested lists, blockquote behaviour

**Batch C — PreviewPopout bounds clamping**
- `clampToViewport(x, y)` helper
- Call on drag, on mount from saved position, on window resize
- Keep title bar reachable at all times
- Append TESTING.md section: drag off top, drag to corners, window resize pulls back, reload with off-screen saved position, close/reopen, self-resize

### Round 2 — Itinerary Client Experience (part 1)

**Batch D — Itinerary at a Glance**
- Migration `0016_itinerary_timezone.sql` — `itineraries.timezone TEXT`
- Migration `0017_portal_items_variant.sql` — `portal_items.variant TEXT NOT NULL DEFAULT 'full'`
- Extend `setup-db.js` requiredColumns + Drizzle schema files
- `lib/itineraries/derive.ts` — `deriveGlance(itineraryId)`
- `app/api/itineraries/[id]/glance/route.ts` — GET, auth-gated
- `components/portal/glance/ItineraryGlanceView.tsx` — print-friendly renderer
- `PortalWall.tsx` — `variant === 'glance'` renders glance view
- `ItineraryEditor.tsx` — timezone dropdown
- Append TESTING.md section: derivation, missing stay/anchor, print, timezone field, glance variant render, full variant unchanged

### Round 3 — Itinerary Client Experience (part 2)

**Batch E — Today's Plan card**
- Depends on Batch D's `derive.ts`
- `components/portal/TodayCard.tsx` — three states (pre-trip countdown, during-trip today, post-trip)
- `PortalWall.tsx` — render above tiles when applicable; nothing when not (no placeholder)
- Modal expansion reuses `ItineraryView` (during) and `deriveGlance` (pre-trip)
- Share: `navigator.share` with clipboard fallback
- Download: print stylesheet
- Append TESTING.md section: all three states, no-itinerary / no-departure / outside-window → no card, modal expand, share, download, timezone respected, card above tiles

### Round 4 — Phase 7.3 sweep

**Batch F — build the three survivors (SHIPPED)**
- Publish Validation (required blocks filled)
- Error Boundaries per block
- Responsive Preview (desktop / tablet / mobile)
- Append TESTING.md section
- Total ~4.5 hours


### Round 4b - Gallery Collage (Batch H)

**H1 - renderer + data (DONE, shipped)**
- `e683a2f` - `types/blocks.ts` - GalleryData extended with style/columns/aspect/gap/captionDisplay + 5 type unions
- `5e39e6b` - `GalleryRenderer.tsx` - 4 layout styles (grid, masonry, carousel, hero-then-grid), `<dialog>` lightbox, print rules, defaults
- `46b16e5` - `docs/TESTING.md` - Batch H1 section (test cases + known limitations)
- Verified: tsc clean, 139 vitest tests passing, defaults render identically to pre-H1

**H2 - editor UX (DONE — shipped; verified in code Nov 23, 2026)**
- `GalleryBlockEditor.tsx` - bulk upload zone, thumbnail strip + drag reorder, layout controls header, per-image detail collapse
- `docs/TESTING.md` - Batch H2 section
- H2 is what makes the H1 layouts reachable from the admin UI

See `docs/BATCH-H-PLAN.md` for full spec.

### Round 5 — Launch Day

**Batch G — Phase 7.7 execution**
- The Launch Day checklist below IS the test
- Completed on the mini PC
- After completion, append TESTING.md "Launch Day verification" section recording what passed
- No code changes expected; if issues surface, mini-batches within this Round

### Testing pass

- Read accumulated `docs/TESTING.md`
- Run through every batch's checklist on a real browser
- Fix what's broken in new mini-batches
- Repeat until green

---

## Itinerary Client Experience (SHIPPED)

Two client-facing views derived entirely from existing itinerary data. **No authoring surface.** Myah builds the detailed itinerary once; the Glance and Today's Plan fall out automatically. Zero marginal work.

### Itinerary at a Glance

Per-day point form, printable via existing print stylesheet. Shows: day number + date, where you're sleeping (hotel name only), how you're getting there (airline + flight number / train line / "Transfer"), optionally one anchor activity line. Hides: times, booking references, addresses, phone numbers, segment instructions, fine detail.

Missing-stay behaviour: omit the sleeping line. Reflect what's there; never invent.

Attachment: `portal_items` row with `source_type='itinerary'` plus a new `variant` column (`full` | `glance`). Default `full` for backward compatibility.

### Today's Plan card

Auto top-of-wall card showing the client's current context. Same derivation principle. Three states:

- **Pre-trip:** collapsed countdown ("Today" / "Tomorrow" / "N days until [destination]"); expanded full trip summary (Glance content); share (copy link / native share); download full itinerary PDF.
- **During trip:** collapsed today's date + one-line summary; expanded full day view (reuses `ItineraryView` day rendering); share; download today's plan PDF.
- **Post-trip:** hidden, or "Trip complete" with download only.

Wall renderer checks: itinerary attached? departure date set? today in window? If yes, render. If no, render nothing — no placeholder, no "no trip" message.

Expansion: modal (consistent with existing admin patterns), reuses `ItineraryView`. Download: print stylesheet PDF (respects the no-PDF-pipeline guardrail). Share: copy portal wall link / native share sheet — recipient still needs their own magic link. No public bypass.

### Locked decisions

- Timezone: itinerary-level IANA field (`itineraries.timezone`). Fallback to first travel leg, else null.
- Ordering: Today's Plan first, then Glance.
- Placeholder: never. Absent context = absent card.

### Anticipated files (when built)

- `components/portal/TodayCard.tsx`
- `components/portal/glance/ItineraryGlanceView.tsx`
- `lib/itineraries/derive.ts`
- `app/api/itineraries/[id]/glance/route.ts`
- Migration `0016_itinerary_timezone.sql`
- Migration `0017_portal_items_variant.sql`
- `components/portal/PortalWall.tsx` updated to render TodayCard above tiles

---

## Outstanding bugs from testing pass

Three bugs found in the last testing session. **All three are fixed** — Batches A, B, and C shipped, and B and C were re-verified in code on Nov 23, 2026. Kept below for the record.

### 1. PreviewPopout bounds clamping

The in-page popout can be dragged off-screen top and becomes unrecoverable. PiP exists as the preferred mode, but the fallback popout is still reachable and this bug persists. Fix: clamp `top` and `left` on drag so the popout title bar stays within the viewport.

### 2. Body block Tab handler

Tab in the Body editor indents the whole block instead of the list item (when in a list) or doing nothing (when not). Fix: add a Tab keyboard handler in `TipTapEditor` that calls `sinkListItem` when in a list, and `preventDefault` (no-op) otherwise.

### 3. Gallery block upload/library

The Gallery block still uses URL-only inputs. Should reuse `ImageSourcePicker` (upload / paste URL / library picker) like the Hero and Image blocks. Fix: swap the Gallery block's image input for `ImageSourcePicker`, same wiring as `HeroBlockEditor` and `ImageBlockEditor`.

---

## Phase 7.6.8 — Notepad tag behaviour (REJECTED)

Specced in Phase 7.6 but never built. **Rejected, not deferred.**

Original spec:
- Member names auto-populate as notepad tags on portal creation
- Removing a member removes their tag from autocomplete (old notes keep the tag text)

**Rationale for rejection:** the current notepad uses free-text comma-separated tags with autocomplete from portal members + previously-used tags. This already covers the discoverability need without the noise. Auto-populating every member name on portal creation would clutter the suggestion list on portals with many members. Auto-removing on member removal is also questionable — old notes referencing a removed member should keep their tag text, which they already do.

The autocomplete from portal members already handles discovery. Phase 7.6.8 adds complexity for no clear benefit.

---

## Phase 7.3 — Production Hardening (swept)

**Sweep complete (Batch F).** Results:

| # | Item | Class | Notes |
|---|------|-------|-------|
| 1 | better-sqlite3 crash on mini PC | **MOOT** | Codespace-only, resolved by Node 22 pinning. No code needed. |
| 2 | Delete Canvas system | **DEFER** | 14 files in `components/editor/canvas/`, `mode === "design"` branches exist but no DB rows use `design`. Leave frozen — deletion is risk with no reward. |
| 3 | Preview popup (modal → floating → fullscreen) | **DONE** | `PreviewPopout.tsx` ships floating + fullscreen. |
| 4 | Target surface token conversion | **DROPPED** | 144 gray tokens found (not ~20-30 as originally estimated). Earlier 7.9 plan already dropped this — neutral greys work fine. |
| 5 | Undo / Redo (global stack, capped 50) | **EDITOR-ONLY DONE** | TipTap toolbar has per-editor undo/redo. App-wide stack dropped — significant architecture for low value in single-admin. |
| 6 | Publish Validation (required blocks filled) | **DONE** | Shipped in Batch F (`lib/blocks/validate.ts`); verified Nov 23, 2026. |
| 7 | Error Boundaries per block | **DONE** | Shipped in Batch F — `BlockEditor.tsx` wraps each block in `<ErrorBoundary>`; verified Nov 23, 2026. |
| 8 | Responsive Preview (desktop/tablet/mobile) | **DONE** | Shipped in Batch F — 768px / 375px presets in PreviewPopout; verified Nov 23, 2026. |

**Batch F scope (3 items):**
- #6 Publish Validation — reject publish if any `required` block is empty. ~2h.
- #7 Error Boundaries per block — wrap each block in `<ErrorBoundary>` with "Block failed to render" fallback. ~1h.
- #8 Responsive Preview — desktop / tablet (768px) / mobile (375px) width presets in `PreviewPopout`. ~1.5h.

**Total: ~4.5 hours.**

---

## Phase 7.7 — Launch Day (Batch G)

✅ **COMPLETED Nov 22, 2026** — by a different route than the checklist below planned: the site is served via **Tailscale Funnel** (not Cloudflare Tunnel) and email runs on **Gmail SMTP** (not Resend — no domain was purchased). Items that only applied to the planned route (Resend account/DNS, Cloudflare checks, LUKS encryption, the dedicated `myahtravels` user) were bypassed rather than done. What does run: localhost-bound app behind the Funnel, TOTP enforcement, per-minute email-queue cron, nightly backups via `~/backup-site.sh` (to the same disk — an off-disk target is still open, see "What's left"), daily portal purge, fail2ban, automatic security updates. The checklist below is kept as the record of the original plan.

Operational checklist for the deployed system. Completed on the mini PC. This section is the compressed version; the full checklist lives in this document below the summary if needed.

### Pre-launch

- TOTP enforcement: `TOTP_ENFORCEMENT=true` in `.env` on mini PC (read by `app/admin/(dashboard)/layout.tsx`), enroll first authenticator, verify redirect to `/admin/enroll-2fa`, store TOTP secret in password manager
- **Bind localhost (M.8):** `npm start` must use `next start -H 127.0.0.1` — behind Cloudflare Tunnel. If the app binds 0.0.0.0 the LAN can reach it and forge `cf-connecting-ip` to bypass the login rate limit.
- Dependencies: `npm ci`, verify `@tiptap/extension-*` in `node_modules`, run `setup-db.js`
- Resend: account, domain verified, DNS records (SPF/DKIM/DMARC), production API key, `SITE_URL`, `CRON_SECRET`, `EMAIL_FROM`, `EMAIL_ADMIN_TO`

### OS + hardware hardening

- LUKS full-disk encryption at install; passphrase in password manager
- Dedicated non-root app user (`myahtravels`)
- SSH: `PermitRootLogin no`, `PasswordAuthentication no`, SSH key added, test key-only login before closing current session
- Firewall: `ufw default deny incoming`, `ufw default allow outgoing`, `ufw allow from LAN subnet to port 22`, `ufw enable`
- `unattended-upgrades`, `fail2ban`, `ufw`
- Network isolation: no VLAN shared with daily-driver devices; no SSH keys from mini PC to other LAN devices

### Environment + DB security

- `.env` on mini PC: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_ADMIN_TO`, `SITE_URL`, `CRON_SECRET`, `PORTAL_MAGIC_LINK_EXPIRY_DAYS`, `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `.env` in `.gitignore`, `chmod 600`
- `NODE_ENV=production` (enables secure cookies)
- App runs as `myahtravels` user, not root
- `chmod 700 data/`, `chmod 600 data/site.db`, `chown -R myahtravels:myahtravels data/`
- Confirm `data/` not served by web app, not in tunnel-exposed path

### Backups (CRITICAL)

- `age-keygen` → public key stored in `/etc/myahtravels/backup.env`
- Private key to password manager NOW
- Backup script writes to external location (USB, LAN, or encrypted offsite)
- Encrypt dump: `sqlite3 data/site.db .dump | gzip | age -r <pubkey> > backup-$(date +%F).sql.gz.age`
- Schedule daily: `0 2 * * * /var/www/site/scripts/backup.sh`
- Verify first backup runs; keep 7 daily + 4 weekly + 3 monthly
- **Test restore on scratch machine BEFORE launch** — extract, decrypt, load, verify client records

### Cloudflare Tunnel

- Tunnel → `http://localhost:3000` only
- Cloudflare Access NOT used (breaks magic links)
- `cloudflared tunnel info` shows only app hostname
- `dig <domain>` points at Cloudflare IPs
- Lock origin to Cloudflare only
- `curl -I http://<home-ip>` from outside → nothing/timed out

### Cron

- Email queue: `* * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/email/process-queue > /dev/null 2>&1`
- Portal purge: `0 3 * * * cd /var/www/site && npx tsx scripts/purge-portals.ts >> /var/log/portal-purge.log 2>&1`
- Verify by checking `email_queue` status transitions after a test send

### First live test

- Restart service, send magic link, confirm email arrives within 60s
- Click link → access page → continue → wall loads
- Verify `portal_session` cookie httpOnly + Secure + SameSite=Lax
- Logout destroys session
- Second magic link revokes the first

### Pre-launch security verification

- `curl -I http://<home-ip>` returns nothing (no direct exposure)
- `sudo ss -tlnp` shows only 3000 + 22
- Cookie flags verified in browser dev tools
- TOTP enforced on `/admin/*`
- Rate limiting: 6 rapid login attempts → 6th is 429
- `/admin/portals/[id]/preview` renders without magic link
- `/portal/[slug]` without session shows "Session Expired"
- `robots.txt` disallows `/admin/*`, `/portal/*`, `/api/*`

### Post-launch (optional)

- Resend webhook → `/api/email/webhook`, set `RESEND_WEBHOOK_SECRET`
- "Pending emails" admin page
- `npx tsx scripts/send-magic-links.ts <slug>` against production
- Monitoring: email failure rate, cron health

---

## Phase 8 — Deferred (post-launch)

**Shelved Nov 23, 2026 — the itinerary-builder part is now scoped** in `Itinerary_Builder_Scope_2026-11-23.md` (goal files): five batches, four owner decisions (D1–D4), no building until the owner answers and says go. The design intent the scope serves, in the owner's words: one trip = one itinerary, even when the trip mixes hotels, resorts, and a cruise — each part carries its own scheduling/format handling inside the single itinerary. Blanket per-type documents (a separate cruise itinerary, a separate resort itinerary) are explicitly NOT the goal; they would split one trip into two documents. The purpose is to streamline the builder, save the writer time, and keep a trip organized — not to add surface area. The bullets below remain raw notes for the *other* Phase 8 ideas (People, portal enhancements), which are not part of the itinerary-builder scope.

- **Itinerary V2:** options segments, cruise mode, overlapping stays, group splits
- **People & Tagging V2:** triggered People table, per-person itinerary lookup, PII isolation
- **Portal enhancements:** client reply, global announcements, docs acknowledgment
- **Content migration:** template migration (Canvas → Block), inline editing
- **Low priority:** dark mode, template versioning, reading time / word count, additional block types

---

## Architecture Decisions (Locked)

### Autosave Hook
- Single `saveInternal()` path — no other `onSave` calls
- Multi-value in-flight dedup via `Map<T, number>`
- Version gating: stale responses ignored
- Mount gating: React state updates only
- Refs + localStorage NOT mount-gated
- Unified save pipeline: debounce, flush, retry
- No save queue, no offline support, no undo (v1)

### Durability Layer
- localStorage only, synchronous writes
- Namespaced keys: `myahtravels:draft:{entityType}:{entityId}:{fieldPath}`
- try/catch wrapped, never blocks editing
- Draft cleared only on latest-version success + value match
- Discard: clears drafts for current itinerary only
- Multi-tab: unsupported, documented

### Form Primitives
- `useAutosaveField` handles all logic
- Primitive values only (string | number | boolean | null)
- Four field components: Text, Date, Time, Select
- External value sync via refs

---

## Guardrails (Do Not Violate)

| Guardrail | Applies To |
|-----------|-----------|
| No raw colour pickers on surfaces | Hero presets are named options. Exception: inline text/highlight in Body block uses curated presets + raw picker |
| No per-segment styling | Itinerary colours derive from type + theme |
| No free icon picker | Content tile icons are fixed enum |
| No manual reordering | Itinerary segments ordered by time (or explicit manual via order_mode) |
| No CMS-style versioning | Live edits, snapshot exports |
| Notepad never leaks to client | Admin-only scoping |
| No attendees on segments | People tagging lives only in Notepad |
| Stays belong to one section | No cross-section stays |
| Empty days render placeholder | Never blank |
| Flights = Travel segments | No separate hierarchy |
| No merged data sources | Unified via `portal_items` |
| No PDF pipeline | Print stylesheet only |
| Autosave never blocks editing | localStorage failures swallowed |
| React state gated by mount | Refs + localStorage always update |
| All renderers import `buildExtensions` | No parallel extension lists |
| Itinerary client views are derived | No authoring surface for glance or today's plan |
| Never use `@tiptap/html`'s `generateHTML` | zeed-dom drops inline styles |

---

## Known Issues

1. **better-sqlite3 crash in Codespace (historical)** — Environment-specific, reported in early sessions. Not reproduced recently. Not present on local PC (Node 22) or mini PC deployment.
2. **Canvas system frozen** — Legacy files in `components/editor/canvas/`. Unwired from nav and TipTap. Pending deletion when confirmed unnecessary.
3. **`schema.sql` outdated** — Use `scripts/setup-db.js`.
4. **Codespace Node version** — Codespace runs Node 24; local runs Node 22 LTS. Minor drift; both work. Local is deployment-target.
5. **`TESTING.md` coverage gaps** — break-session features covered at `65f857f`. Still uncovered: block system beyond Body, client-facing post rendering, Content Library, admin dashboard. Each batch fixes its own gap going forward.
6. **PDF exposure in public repo** — CLOSED. No uploads tracked on `main` (verified Nov 23, 2026), and the owner confirmed the file was test data, so its presence in git history needs no cleanup.
7. **`public/uploads/` not in `.gitignore`** — FIXED. `.gitignore` carries `public/uploads/*` + `!public/uploads/.gitkeep` (and the `data/uploads/` pair).
8. **Uploads 404 after `next build`** — RESOLVED. Uploads serve through `app/api/uploads/[...path]` with auth checks, outside `public/`.
9. **Rate-limit FINDINGs** — FIXED Nov 23, 2026. Per-username limiter added; a proven password resets both counters. See "Outstanding from earlier sessions" above.

---

## Testing Debt — Coverage Map

**What `docs/TESTING.md` covers:**
- Phase 7.6 Waves 2-4 (multi-leg travel, ban/revoke, hero styling)
- Phase 7.8 Waves A-D (suggestions, duplication, drag-reorder, bulk-add, snippets, paste-booking, stale entities, kill switch)
- Phase 7.9 stubs (E1-E12)
- Phase 9 stubs (F1-F9)
- TOTP enrollment (S1-S5)
- Break-session features (PiP, divider config, context menu submenus, gradient tiles, body content versioning)

**What `docs/TESTING.md` does NOT cover:**
- Block system beyond Body — Title, Hero, Image, Gallery, Callout, ProsCons, Verdict, QuickFacts, Quote
- Template selection in editor
- Client-facing post rendering — `/blog/[slug]`, `/guides/[slug]`, `/reviews/[slug]`
- Content Library — admin list, add PDF/image/text, attach to portal
- Admin dashboard — widgets, storage usage, recent activity

**Forward process:** each batch appends its own TESTING.md section. Coverage gaps close as batches ship.

---

**Last Updated:** November 23, 2026
