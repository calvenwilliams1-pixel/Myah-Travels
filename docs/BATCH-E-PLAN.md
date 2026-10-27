# Batch E — Timezone & Time Tools

**Status:** Proposed, not built. Deferred until after Batch F (Phase 7.3 sweep) and Batch G (Launch Day).

---

## 1. Problem

Myah works across timezones constantly. Client in Tokyo, flight from Toronto, hotel in Singapore. Every "what time is it for them" or "when does that flight land" currently sends her to an external tool. The site already knows timezones via `itinerary_sections.timezone` (built in Batch D-c) and `itinerary_travel_legs`. This closes that gap.

## 2. Goal

Three tabs in `/admin/tools`, admin-only:

1. **Time** — search any city / airport / zone, see current time; optional date + time + source/target selection converts between zones
2. **Flight** — depart zone/date/time + arrive zone/date/time → duration and cross-zone conversions
3. **Itinerary** — pick an itinerary, see current local time per section

No library. `Intl.DateTimeFormat` handles conversion and DST via the `resolveLocalTime` helper (§6).

## 3. Scope

### 3.1 In scope

- `/admin/tools` page with three tabs (URL query `?tab=` with fallback to first tab)
- Nav link in admin dashboard
- Curated alias tables:
  - ~100 cities (weighted toward cruise ports and resort areas — Cancún, Phuket, Maui, Nassau, Civitavecchia — not just capitals)
  - ~150 IATA airports mapped straight to IANA zones
  - ~60 countries mapped to their zones (`COUNTRY_ZONES`)
- Home zone in `settings` table, **editable from page header**, default `America/Toronto`, server-validated
- Recent picks (last 5) in localStorage, per-browser
- DST handling via `resolveLocalTime`
- "±1 day" badges on all conversions
- Flight mode: duration from UTC instants, arrival date input, derived "+N days" display, guard rails
- Itinerary lookup with "Timezone not set" for null sections
- TESTING.md section

### 3.2 Out of scope

| Excluded | Why |
|----------|-----|
| Dashboard widget with active client times | Needs "active portal" semantics defined; separate post-launch batch |
| Itinerary-wide day-by-day time overview | Report UI, not a quick tool |
| Client-facing access | Day by Day already covers client timezone context |
| Automatic timezone detection (GPS / IP) | All zones user-selected |
| Fuzzy search beyond alias tables + `Intl.supportedValuesOf` | Curated covers 99% |
| Full-dataset airport enrichment | Tracked follow-up (§8) |
| Inline modal in itinerary editor | Phase 2 |

## 4. Data model

### 4.1 Settings

New key `tools_home_timezone` in `settings` table. Default `"America/Toronto"`. Editable via a small selector in the page header (§5.1), writes behind `requireAuth` and CSRF pattern from other admin mutations. **Server-side validation** rejects any value that `new Intl.DateTimeFormat("en-US", { timeZone: value })` throws on.

### 4.2 Alias tables

New file `lib/tools/aliases.ts` with three exports:

- `CityAlias`: name, country, zone
- `AirportAlias`: iata, name, city, country, zone
- `CountryZones`: name, aliases[], zones[], optional defaultZone

**Multi-zone countries** (picker shown): US, Canada, Australia, Brazil, Russia, Mexico, Indonesia, Spain (mainland default, Canary Islands option), Portugal (mainland default, Azores/Madeira options), Chile (mainland default, Easter Island option), Ecuador (mainland default, Galapagos option). Optional additions if cruise/Arctic itineraries expected: French Polynesia (Tahiti default, Marquesas at -9:30 option), Greenland.

**Single-zone countries** (many aliases): China, India, Japan, Singapore, South Korea, Thailand, Vietnam, UAE, UK, France, Germany, Italy, Nepal (Asia/Kathmandu), etc.

**Shorthand aliases:** NYC -> America/New_York, LA -> America/Los_Angeles, SF -> America/Los_Angeles, Bali -> Asia/Makassar.

### 4.3 Search ranking

1. Exact IANA zone match (Asia/Tokyo)
2. Exact IATA code match (NRT)
3. Exact city name match, diacritic-insensitive (Zurich for Zürich, Sao Paulo for São Paulo)
4. City name prefix match
5. Country name match (with picker if multi-zone)
6. Fuzzy contains on IANA zone string

Results deduped by IANA zone — NRT and HND both resolve to Asia/Tokyo, one entry shown. Each entry shows the matched name plus zone. UTC and GMT as explicit aliases (Intl.supportedValuesOf may omit them).

### 4.4 Bundled seed reuse

`data/airports.json` (64 entries with iata, name, city, country, timezone) loaded read-only. Deduped against AIRPORT_ALIASES by IATA — curated wins. Search behaves identically with or without the seed.

### 4.5 Persistence split

| Data | Storage | Reason |
|------|---------|--------|
| Home zone | `settings` table | Shared, admin-configured |
| Recent picks | localStorage | Per-browser convenience |

`recent.ts` wraps reads in try/catch, guards `typeof window`, reads inside an effect (not during SSR).

## 5. UI

### 5.1 Page shell

- Admin-only via `requireAuth`
- Nav link in admin dashboard
- Tabs: **Time**, **Flight**, **Itinerary** (URL query `?tab=` with fallback to Time)
- Page header: home zone selector (search + save), server-validated

### 5.2 Shared TimezoneSearch component

- Combobox with keyboard: Arrow Up/Down to move, Enter to select, Escape to close
- Search across §4.3 ranking, dedupe by zone
- Multi-zone country match shows picker submenu

### 5.3 Time tab

- **Source zone:** defaults to home zone, changeable via search
- **Target zone(s):** searched zones, one or more; each target gets its own result row
- **Default view:** source + no targets = just current time in source
- **Add date + time:** turns into a conversion from source at that wall clock time to each target

Result display:

- Local time, date, weekday
- **UTC offset primary** (e.g. `UTC+9`)
- Abbreviation only if Intl returns a real one (`en-US` gives EDT for New York but GMT+9 for Tokyo)
- "13h ahead of you" (or behind) — drives off home zone
- Recent picks list below

**Client-only clock.** Current time via `setInterval` in a `useEffect` with cleanup. **No SSR rendering of current time** — would hydrate-mismatch. Placeholder shown until mounted.

### 5.4 Flight tab

- Depart zone + date + time
- Arrive zone + **arrival date** (defaults to departure date) + time
- **No separate day offset field** — "+N days" derived from the two dates and displayed alongside the duration
- **Computed from UTC instants**, never wall-clock subtraction
- Result: duration (`13h 45m`), both times converted to the other zone, ±1 day badge where relevant

Guards:

- **Negative duration -> block with error**
- **Duration >30h -> non-blocking inline note**
- **Nonexistent time at either end -> block with warning**
- **Ambiguous time at either end -> show possible durations (up to four if both ends ambiguous), labeled by offset+abbreviation**

### 5.5 Itinerary tab

- Dropdown: all itineraries (live + archived, marked)
- Per section: name, timezone or **"Timezone not set — set in section editor"**, current local time, offset from home
- Uses `resolveSectionTimezone(section, itinerary)` from `lib/itineraries/derive.ts`

## 6. DST handling — resolveLocalTime(T, Z)

Signature:

- Returns `{ kind: "valid" | "ambiguous" | "nonexistent"; instants: Date[] }`
- 1 instant for valid, 2 for ambiguous, 0 for nonexistent

Steps:

1. Parse wall clock **by components** using `Date.UTC(y, m-1, d, h, min)` — never `new Date("2026-03-08T02:30")`
2. Compute zone offset at `T - 24h` and `T + 24h` (o1, o2)
3. If o1 === o2: no transition nearby, valid, return single instant (T - o1)
4. Else: build candidate instants T - o1 and T - o2; keep candidates that **round-trip** (format back in Z, compare numeric parts)
5. **2 valid** -> ambiguous. Display both side by side, labeled e.g. "first, UTC-4 (EDT)" / "second, UTC-5 (EST)". **Earlier instant labeled first, later labeled second** — deterministic.
6. **0 valid** -> nonexistent. Warn, no conversion.
7. **1 valid** -> valid.

Format internals:

- `en-US` locale with `hourCycle: "h23"`
- `formatToParts` for offset extraction
- `timeZoneName: "longOffset"` returns bare `"GMT"` for zero offset and `"GMT+05:30"` otherwise
- Unicode minus may appear — normalize

**±1 day badge:** compare date portion of input in source zone vs output in target zone.

## 7. Acceptance criteria

1. Convert Toronto 14:00 summer -> Tokyo -> Tokyo shows UTC+9, difference is 13h ahead
2. Same on winter date -> Tokyo still UTC+9, difference is 14h ahead
3. Convert crossing midnight -> "+1 day" badge shown
4. Spring-forward nonexistent (2026-03-08T02:30 America/New_York) -> warn, no conversion
5. Fall-back ambiguous: 2026-11-01T01:30 America/New_York -> both results, labeled "first, UTC-4 (EDT)" / "second, UTC-5 (EST)"
6. Europe case: 2026-10-25T01:30 Europe/London -> both results, labeled by offset
7. Transition-gap week: Toronto -> London difference is 4h, not 5h, between Oct 25 and Nov 1
8. Half-hour offsets — Americas: America/St_Johns shows -3:30 winter / -2:30 summer
9. Search NRT -> Asia/Tokyo
10. Search Tokyo -> Asia/Tokyo
11. Search USA -> picker shown with US zones
12. Search Bali -> Asia/Makassar
13. Search India -> Asia/Kolkata (+5:30)
14. Search Nepal -> Asia/Kathmandu (+5:45)
15. Search Zurich and Zürich -> same result
16. Search NYC -> America/New_York
17. Flight Toronto 22:00 (2026-06-15 EDT) -> Tokyo 01:00 (2026-06-17 JST, +2 days) -> duration 14h
18. Flight Sydney 10:00 (2026-06-15 AEST) -> Los Angeles 06:00 (2026-06-15 PDT) -> duration 13h, arrival clock earlier than departure
19. Flight negative duration -> block with error
20. Flight >30h -> non-blocking note
21. Itinerary lookup: section with null timezone -> "Timezone not set — set in section editor"
22. Home-zone setting persists and drives all ahead/behind labels
23. Home-zone selector saves and updates immediately
24. Home-zone selector rejects invalid IANA string with server error
25. Recent picks persist across reloads; page works with storage disabled
26. Page unreachable to non-admin (401/redirect)
27. Keyboard nav in combobox: arrows, Enter, Escape
28. Tabs persist via URL, unknown ?tab= falls back to Time

## 8. Follow-up (not blocking)

**Enrich `fetch-static-data.js`:**

- Add `timezone` field via static country-to-IANA table for single-zone countries + build-time coordinate lookup for multi-zone (library runs in script only, never in app bundle)
- Map ISO country codes to names, or store both
- Regenerate `data/airports.json` after enrichment
- Track as separate batch (Batch E-follow-up)

Airlines have no timezone — not touched.

## 9. Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| v1 airport coverage = curated (~150) + seed (64) + Intl.supportedValuesOf. Rare IATA codes miss. | Medium | Curated covers major hubs; Intl catches zone-name searches; follow-up expands |
| Regenerating airports.json drops timezone, changes country format | High if run | Script not run until §8; data/airports.json is _generated: false |
| Ambiguous fall-back confusing | Low | Both results labeled by offset+abbreviation, deterministic first/second |
| Multi-stop flights >30h legitimately | Low | Inline note, non-blocking |
| Hydration mismatch on clock display | Medium | Client-only render, useEffect + setInterval, cleanup, no current-time in SSR |
| Home-zone edit race | Low | Single-admin V1; write idempotent |

## 10. Pre-flight checks

Before any code:

```bash
grep -rn "timezone" lib app components --include=*.ts --include=*.tsx | grep -i airport
grep -rn "country" lib app components --include=*.ts --include=*.tsx | grep -i airport
grep -rn "data/airports.json\|airports.json" lib app components scripts
```

Confirm:

- `settings` table getter/setter helpers exist
- `resolveSectionTimezone` exported from `lib/itineraries/derive.ts`
- Nothing depends on `data/airports.json` shape beyond `lib/suggestions/statics.ts`

## 11. Files touched

**Created:**

- `app/admin/(dashboard)/tools/page.tsx`
- `components/admin/tools/TimeTab.tsx`
- `components/admin/tools/FlightTab.tsx`
- `components/admin/tools/ItineraryTab.tsx`
- `components/admin/tools/TimezoneSearch.tsx`
- `components/admin/tools/HomeZoneSelector.tsx`
- `lib/tools/aliases.ts`
- `lib/tools/time.ts`
- `lib/tools/resolve-search.ts`
- `lib/tools/recent.ts`
- `lib/tools/time.test.ts`
- `lib/tools/resolve-search.test.ts`
- `lib/tools/recent.test.ts`
- `docs/TESTING.md` (append Batch E section)

**Modified:**

- `app/admin/(dashboard)/layout.tsx` — nav link
- `lib/settings/index.ts` — `tools_home_timezone` default
- `docs/TODO.md` — batch plan
- `package.json` — `test:tz` script

## 12. Build plan

**Commit 1:** `lib/tools/time.ts` — resolveLocalTime, format helpers, DST
**Commit 2:** `lib/tools/time.test.ts` — DST edge cases + `test:tz` script running under TZ=UTC and TZ=Asia/Kolkata
**Commit 3:** `lib/tools/aliases.ts` — cities, airports, countries
**Commit 4:** `lib/tools/resolve-search.ts` + tests — ranking, dedupe, diacritics, aliases
**Commit 5:** `lib/tools/recent.ts` + tests — localStorage with guards
**Commit 6:** TimezoneSearch.tsx — combobox with keyboard nav
**Commit 7:** TimeTab.tsx — search + current time + convert (source + multiple targets)
**Commit 8:** FlightTab.tsx — duration + guards
**Commit 9:** ItineraryTab.tsx — picker + section list
**Commit 10:** HomeZoneSelector.tsx + settings default + server validation
**Commit 11:** `app/admin/(dashboard)/tools/page.tsx` + nav link
**Commit 12:** `docs/TESTING.md` Batch E section

Then: end-to-end browser verify (checklist, not a commit).

## 13. Estimated effort

| Piece | Hours |
|-------|------:|
| Page shell + tabs + URL query | 2 |
| Curated city aliases (~100) | 1.5 |
| Curated airport aliases (~150) | 2 |
| Curated country zones (~60) | 2 |
| Search ranking + dedupe + diacritics + country picker | 2 |
| resolveLocalTime + format helpers | 2 |
| Time tab (search + current + convert, source + targets) | 2 |
| Flight tab + guards | 2 |
| Itinerary tab | 2 |
| Home-zone selector + settings + server validation | 1 |
| Recent picks persistence | 1 |
| TESTING.md + browser tests | 2 |
| **Total** | **21.5** |

**Committed estimate: ~22 hours (about 3 working days).**

## 14. Decisions log

Settled answers, recorded so they don't get re-litigated:

- **Search ranking:** exact IANA zone -> IATA -> city (diacritic-insensitive) -> city prefix -> country -> fuzzy zone
- **List sizes:** ~100 cities, ~150 airports, ~60 countries
- **Multi-zone countries in v1:** US, Canada, Australia, Brazil, Russia, Mexico, Indonesia, Spain, Portugal, Chile, Ecuador. Optional additions if cruise/Arctic itineraries expected: French Polynesia, Greenland.
- **Flight guards:** negative duration blocks with error; >30h shows non-blocking inline note; ambiguous endpoints show up to four durations
- **Tab URL query:** persisted, fallback to first tab
- **Home-zone default:** America/Toronto, editable via header selector, server-validated
- **Ambiguous time ordering:** earlier instant labeled first, later second
- **Server validation:** home-zone selector rejects non-IANA strings via Intl.DateTimeFormat throw, uses same CSRF + auth pattern as other admin mutations
- **Tests must run under TZ=UTC and TZ=Asia/Kolkata** via `npm run test:tz` to catch browser-local zone leaks
- **Browser baseline:** Safari 15.4+ / Chrome 99+ / Firefox 93+ / Edge 99+ for Intl.supportedValuesOf. Older browsers fall back to ~100 curated cities + UTC.

---

**End of Batch E plan.**
