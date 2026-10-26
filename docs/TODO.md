# MyCalTravels — TODO.md (Revision 20)

## Status

**All planned phases (7.6, 7.8, 7.9, 9, 9.5) are CODE-COMPLETE.** 87 vitest tests passing, `tsc` clean.

**Current work: batch build then accumulated testing pass.** Features are being shipped in batches; each batch appends its test cases to `docs/TESTING.md`. Testing happens later, in one pass, against the accumulated doc. Full coverage map below.

**Two features are SPECCED but unbuilt:** the Itinerary Client Experience — Itinerary at a Glance + Today's Plan card. Both derive entirely from existing itinerary data, no authoring surface. Spec below; build order in the Batch Plan.

**Three outstanding bugs** from the last testing session, documented below. They are Batch A, B, C in the Batch Plan.

**Phase 7.6.8 (Notepad tag behaviour) is REJECTED** — see its section below for rationale. Not deferred, not scheduled.

**Upcoming:** Phase 7.7 Launch Day (email + magic link go-live, TOTP enforcement, cron entries, backups, OS hardening). Then Phase 7.3 sweep. Phase 8 (social publishing) deferred to post-launch.

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
- Test framework: vitest + testing library (87 tests)
- Itinerary client views (Glance, Today's Plan) derive from itinerary data — no authoring surface

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
| Itinerary Client Experience | 📋 Specced | Glance + Today's Plan card — derived from itinerary data, no authoring surface |
| **Batch build** | **🔄 Current** | **Three bugs, then Glance, then Today's Plan (see Batch Plan below)** |
| 7.3 | ⏳ Pending | Sweep first to confirm what's still needed; then build survivors |
| 7.7 | ⏳ Pending | Launch Day — email + magic link go-live, TOTP enforcement, cron, backups |
| 8 | ⏳ Future | Options segments, cruise mode, People table — post-launch |

---

## Batch Plan

Build order, then testing pass. Every batch updates `docs/TESTING.md` with its test cases before commit. Every batch is a heredoc, verified, committed, pushed.

### Round 1 — Three outstanding bugs

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

**Batch F — audit and rebuild Phase 7.3 survivors**
- Walk the 8 Phase 7.3 items; mark each MOOT / DONE / STILL PENDING / NEW SCOPE
- Update this TODO with the survivors
- If any code work survives, build it; append TESTING.md section accordingly
- No code if all items resolve to MOOT / DONE

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

## Itinerary Client Experience (SPECCED — not built)

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

Three bugs found in the last testing session, not fixed. They are Batches A, B, C.

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

## Phase 7.3 — Production Hardening (sweep first)

Do not build against this list until it has been swept (Batch F). Several items may already be done or moot.

- Fix better-sqlite3 crash on mini PC deployment — likely moot per MASTER-PROMPT Known Issue 1
- Delete Canvas system — decision needed; MASTER-PROMPT says frozen, safe to leave
- Preview popup (modal → floating → fullscreen) — likely already done (PreviewPopout shipped)
- Target surface token conversion (~20-30 `bg-gray-50/100` → semantic tokens)
- Undo / Redo (global stack, capped 50)
- Publish Validation (required blocks filled)
- Error Boundaries per block
- Responsive Preview (desktop/tablet/mobile)

Sweep marks each MOOT / DONE / STILL PENDING / NEW SCOPE. Surviving items are built in the same batch.

---

## Phase 7.7 — Launch Day (Batch G)

Operational checklist for the deployed system. Completed on the mini PC. This section is the compressed version; the full checklist lives in this document below the summary if needed.

### Pre-launch

- TOTP enforcement: `TOTP_ENFORCEMENT=true` on mini PC, enroll first authenticator, verify redirect, store secret in password manager
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

Do not schedule until Launch Day completes.

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

**Last Updated:** October 26, 2026
