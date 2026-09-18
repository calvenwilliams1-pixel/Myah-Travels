# MyCalTravels — Phase 7.9 and Phase 9 Plan

**Status:** Locked. Ready to build.
**Last updated:** 2026-09-17

This document is the roadmap for the next two phases. It records decisions, reviewer input, and the specific overrides made by the stakeholder. Read alongside docs/MASTER-PROMPT.md (project overview) and docs/CODE-PLAN.md (file map).

---

## Part 1 — SRS Amendments

Three rules in the existing SRS are being amended or expanded. These override the previous wording.

### 1.1 Sensitive data rule (rewritten)

**Previous wording:** "Logistics notes only (dietary needs, mobility, preferences). No diagnostic detail, treatment information, or medical history."

**Problem:** "No medical history" was ambiguous enough to exclude practical facts a travel agent needs — like allergies or dietary restrictions. The original wording was too broad.

**New rule:**

Store:
- Preferences (seat, room, timing, pace)
- Dietary restrictions and allergies
- Travel habits (early riser, dislikes transfers, prefers trains)
- Family situations (travels with grandchildren, honeymoon, solo)
- Personal notes (likes, dislikes, anniversaries, celebrations)

Do not store:
- Payment information (credit cards, bank details)
- Government-issued ID numbers (SIN, SSN, national insurance)
- Passport numbers
- Home addresses as structured fields (freeform in notes is acceptable if context requires it)

The distinction: sensitive data means credentials and identifiers. Practical client memory is the whole point of the system.

### 1.2 Colour guardrail (amended)

**Previous guardrail:** "No raw colour pickers for writers. Curated palettes only."

**Amendment:** The prohibition stays for surface colours (themes, hero banners, backgrounds) — those remain curated-only. But inline text and highlight colours in the Body block may use a raw colour picker, augmented by a curated preset library that the writer can extend or overwrite.

**Rationale (stakeholder):** Optional does not mean harmful. Freedom in a small surface with automatic colouring elsewhere keeps daily decisions minimal.

### 1.3 Post editor scope (expanded)

The post editor graduates from typewriter to stylized writing tool. This expands the guardrail against "design tools within a writing tool" — the writer is explicitly given typography controls within body text, on the reasoning that personal expression in written form is a feature, not a liability, when the surface is bounded.

---

## Part 2 — Phase 7.9: Post Editor and Writing Tools

### 2.1 Product intent

Turn the post editor from typewriter into a stylized, personalized writing tool. Myah writes travel narratives, guides, and reviews. The current editor supports typing but lacks the visual richness that makes writing feel owned.

### 2.2 Feature list

**Rich text formatting (Body blocks):**
- Bold, italic, underline
- Text colour: semantic tokens (Primary, Accent, Muted, Success, Warning) + raw picker
- Highlight: curated set (Yellow, Blue, Green, Pink, plus custom)
- Font family: curated set of approximately 20 blog and writing staples, default Arial
- Font size: preset sizes (Small, Normal, Large, XL) plus fine-tune numeric control
- Alignment: left, center, right, justify
- Lists: bulleted, numbered, nested
- Links: external URLs, plus optional internal links
- Blockquote
- Horizontal rule / divider
- Clear formatting

**Toolbar UX:**
- Sticky at top of the editor
- Grouped: Text style / Structure / Insert
- Collapsible on narrow viewports (primary row always visible, secondary behind a more menu)
- Keyboard shortcuts: Cmd+B, Cmd+I, Cmd+U, Cmd+K

**Word metrics:**
- Live word count
- Reading time estimate (200 words per minute, standard)
- Character count

**Paste sanitization:**
- Strip inline styles, font families, and colours from pasted content (Word, Gmail, other websites)
- Preserve structural markup: bold, italic, lists, links, headings
- This is a required guardrail enforcement point, not optional

**Colour presets system:**
- color_presets table: named presets with hex values, organized by category (text / highlight)
- Curated defaults seeded on first run
- Myah creates new presets or overwrites curated defaults
- Global library (site-wide), no per-post override
- Picker UI shows presets as swatches + a raw picker for new colours
- Save current selection as preset: name it, it joins the library

**Pop-up preview:**
- Pop-out preview: floating panel, resizable, movable
- Fullscreen preview: button inside the pop-out
- No modal — redundant with floating
- Retires the current fixed right-side pane; pop-out becomes the default preview

**YouTube auto-embed:**
- Detect YouTube URLs in Body blocks
- Render as inline player
- Preserve the URL as the source of truth

**Social handles settings:**
- New settings page section: Instagram, TikTok, Facebook, YouTube handles/URLs
- Stored in the settings table
- Available to future features (public site footer, post metadata) — no publishing in this phase

### 2.3 Reviewer input and overrides

Two external reviews were conducted. Summary of their recommendations and the stakeholder's response:

| Topic | Reviewer consensus | Stakeholder decision |
|-------|-------------------|---------------------|
| Font family | Drop entirely; one font is a feature | Override — keep ~20 curated fonts, default Arial |
| Raw colour picker | Drop; semantic tokens only | Override — keep picker, add presets system |
| Underline | Claude: drop (collides with links); 365: keep | Keep — clash is not a reason to remove |
| Font size | Claude: cut; 365: 3 presets only | Both — presets plus fine-tune |
| Pop-out preview | Both: drop modal | Agree — pop-out + fullscreen only |
| Word count | Both: add | Add — plus reading time |
| Paste sanitization | Claude: required | Add as required guardrail |
| Code formatting | Both: cut | Cut — no travel use case |

**Rationale recorded:** The stakeholder's position is that the reviewers' "reduce decisions" principle was being over-applied. Optional features do not create mandatory decisions. Myah's daily work stays fast because automatic colouring handles the bulk; the richer controls exist for when she wants them.

The reviewers' "Canva drift" concern is real and acknowledged. The stakeholder's counter is that guardrails remain (no freeform layout, no theme colour pickers, no design surface on blocks themselves) and the expanded controls are scoped to inline text formatting.

### 2.4 Scope boundaries (still excluded)

- No freeform block positioning
- No custom themes
- No per-post layout overrides
- No code formatting
- No additional block types

---

## Part 3 — Phase 9: Client Memory System

### 3.1 Product intent

Myah serves returning clients across multiple trips. Right now each portal has its own member list; the same person in two portals is two rows with no link. There is no memory of preferences, past trips, or personal context across time.

Phase 9 builds a canonical client record that persists across portals, with personal notes and trip history.

### 3.2 Architecture

**New tables:**

people
- id, email (unique), canonical_name, inquiry_id (nullable FK to clients table), created_at, updated_at, deleted_at

person_notes
- id, person_id, portal_id (nullable FK), content, created_at, updated_at, deleted_at
- portal_id set = trip-specific note
- portal_id null = global memory note

person_trip_history
- id, person_id, itinerary_id, portal_title, departure_date, return_date, archived_at
- Written when a portal is purged
- Points to the itinerary that survives the purge

**Schema changes:**

portal_members
- Add person_id FK (nullable initially)
- Populated on creation by matching email to people, or creating a new person
- Migration backfills existing members by deduping on email

itineraries
- portal_id becomes nullable
- Add is_archived flag (boolean, default false)
- When portal purges, portal_id nulls and is_archived flips true

portals
- Add keep_until date field (nullable)
- Portal purges at return_date + 90 days, unless keep_until overrides

**Settings:**
- purge_grace_days: default 90, configurable in admin settings

### 3.3 Feature list

**Portal member add with suggestion:**
- Adding a member by email suggests name from people if email matches
- Reuses the AutocompleteInput pattern from Phase 7.8
- Auto-links person_id
- Creates new person record if email is new

**Person page (/admin/clients/[personId]):**
- Canonical name, email, inquiry link (if converted from inquiry)
- Global notes (post-it style, freeform)
- Trip history: one tab per portal they have been part of (live or archived)
- Click tab, view the itinerary that was attached to that portal
- Forget this client action — hard delete person, notes, history (PIPEDA closure)
- Visible reminder: do not store payment info, IDs, passport numbers, or home addresses

**Client notes dashboard (/admin/clients):**
- Search across all people: by name, email, or note content (LIKE, not FTS5 at this scale)
- Recently active clients panel
- Filters: active clients, all clients, includes archived

**Portal purge automation:**
- Runs daily as a scheduled job
- Purges portals where return_date + 90 days is in the past AND keep_until is not set OR keep_until is in the past
- On purge, deletes: portal, portal_members rows, magic links, sessions, hero config, wall items, portal notepad, portal documents
- On purge, keeps: itinerary (detaches portal_id, marks is_archived), library items, person records, person notes
- On purge, writes: person_trip_history row per active member

**Itinerary Library (/admin/itineraries):**
- View of all itineraries (live and archived)
- Filter: live / archived / marked-as-template / all
- Search by title, portal name, date range
- Preview mode (reuses existing preview component)
- Use as template action: copies sections, days, segments, stays to a new itinerary in a target portal, clears occurrence data (dates, references, confirmations, hotel bookings)
- Live itineraries show "used in [portal name]" with a link
- Archived itineraries show "portal purged" marker

### 3.4 Scope boundaries (excluded)

- No sensitive data storage (see Part 1 rule)
- No FTS5 on person notes (LIKE is sufficient at expected scale)
- No migration of existing portal notepad (stays as portal-level)
- No social media publishing or syncing (Phase 8)

### 3.5 Reviewer input

Both external reviews converged on:

- people as a separate table, not entities(kind="person") — entities are suggestion cache, people are domain objects
- One email = one person, don't over-engineer shared emails
- Keep portal notepad separate from person notes
- LIKE search, not FTS5
- Separate /admin/clients page
- No migration of existing notepad
- Add a trip history view (365's suggestion — accepted)
- Add inquiry_id link (Claude's suggestion — accepted)
- Add "forget this client" action (Claude's PIPEDA gap — accepted)

Claude raised a contradiction between "no sensitive data" and the example "allergic to shellfish" — resolved by the SRS amendment above.

Claude also raised shared-email handling. Stakeholder clarified: clients give individual emails; the website has its own outbound email for magic links but that's a config item, not part of the people model. One email = one person stands.

### 3.6 Portal purge — the retention question

Stakeholder concern: hundreds of portals accumulating is a lot of data.

Resolution:
- Automatic purge at return_date + 90 days (configurable)
- Portal documents and wall content deleted (storage saving)
- Itinerary preserved (the actual reference document Myah needs)
- Person trip history preserved via person_trip_history rows
- Library items preserved (they are reusable by design)

This means:
- A 2019 Italy trip's portal is gone
- The Italy itinerary still exists, detached, editable, reusable as a template
- Myah can open a client, see "Italy 2019" tab, click it, and view the itinerary
- She can also open the itinerary library, find Italy 2019, and reuse it for a similar 2028 trip

---

## Part 4 — Roadmap

### Build order

1. **Phase 7.9** (this is next)
   - Wave 7.9-A: Editor toolbar overhaul + colour presets table
   - Wave 7.9-B: Colour presets UI
   - Wave 7.9-C: Pop-out preview
   - Wave 7.9-D: YouTube auto-embed + social handles settings

2. **Phase 9** (after 7.9)
   - Wave 9-A: Schema + person model + backfill
   - Wave 9-B: Portal member add with suggestion
   - Wave 9-C: Person page
   - Wave 9-D: Client notes dashboard
   - Wave 9-E: Portal purge automation
   - Wave 9-F: Itinerary Library

3. **Testing** — local pass across 7.6 + 7.8 + 7.9 + 9 whenever Myah is on the local PC

4. **Phase 7.7 Launch Day** — email + magic link go-live, security audit

5. **Phase 7.3 (trimmed)** — publish validation, error boundaries, responsive preview

6. **Phase 8 (post-launch)** — social publishing, YouTube auto-populate

### Deferred / dropped

- Canvas deletion — dropped (harmless frozen system, not worth the work)
- better-sqlite3 mini-PC fix — deferred to actual deployment
- Global undo/redo — deferred (evaluate post-launch based on usage)
- Target surface token conversion — dropped (neutral greys are fine, gradient toggle in 7.9 covers the whitespace concern)
- Dark mode — dropped permanently (Myah uses light only)

---

## Part 5 — Decision trail

### Stakeholder overrides recorded

**Phase 7.9:**
- Font family: kept (curated ~20, default Arial) — overrides both reviewers
- Raw colour picker: kept, with presets system — overrides both reviewers
- Underline: kept — reviewer split, stakeholder chose keep
- Font size: presets + fine-tune — reviewer split, stakeholder chose both

**Phase 9:**
- Portal purge automatic at 90 days — stakeholder decision
- Configurable grace period in settings
- Per-portal keep_until override
- Itinerary Library as a formal feature (not just data persistence)
- Trip history view (accepted from 365's review)
- Forget this client (accepted from Claude's review)

### Sensitive data rule

Rewritten to match practical reality. Store preferences, dietary restrictions, allergies, travel habits, family situations, personal notes. Do not store payment info, IDs, passport numbers, or home addresses as structured fields.

---

## Part 6 — Recovery instructions

If context is lost:

1. Read todo list (Revision 14) — has the current phase structure and status
2. Read docs/MASTER-PROMPT.md — project overview + current focus
3. Read docs/CODE-PLAN.md — file map + planned files
4. Read this document — Phase 7.9 and Phase 9 plan
5. Read TESTING.md — pending test checklists
6. Check git log --oneline -20 — recent commits
7. Next actionable: whichever wave in Phase 7.9 is not marked complete in todo list

The build always follows: schema/repo first, then API, then client UI, then verification.
