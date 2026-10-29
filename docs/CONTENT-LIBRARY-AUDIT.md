# Content Library Audit — MyCalTravels

**Purpose:** Document what exists in the content/media system, what was intended, what's missing, and what to build. Written before any Batch I code, to establish facts and lock the model.

**Status:** Findings. Decision required at §9.

---

## 1. Executive Summary

The media system was built as **storage**, not as a **library**. Every file uploaded from any block editor lands in `media` + `public/uploads/<folder>/` automatically. That part works: 36 real files, 0 orphans, 0 soft-deleted, disk and DB in sync.

The **library** — the user-facing storefront where files can be browsed, organized, deleted, and reused — was never built. `ImageSourcePicker` has no library mode. `/admin/media` lists files but offers only per-row delete and an upload form. There's no "save to library" concept on upload, no "pick from library" on reuse, no bulk operations, no metadata editing, no folder organization.

`content_library` — a **separate** table with a FK into `portal_items` — exists as a portal-delivery concept (checklists, FAQs, alerts, documents attached to client portals). It has **0 rows** and is a different use case. It is **out of scope** for this fix and stays as-is.

The fix is to **finish the storefront on `media`**: add an `is_library` flag, add library management UI to the existing `/admin/media` page (bulk delete, edit, storage widget, saved-count), add a "From library" mode to `ImageSourcePicker`, add a "Save to library" checkbox on uploads.

**Model decision (§5):** Option A — one library page (`/admin/media`, already titled "Media Library"), one flag, one mental model. `content_library` untouched.

---

## 2. Current State — Facts

### 2.1 `media` table

Schema (`drizzle/schema/media.ts`):

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | auto-increment |
| `file_path` | TEXT NOT NULL | e.g. `posts/1793193222088-Screenshot.webp` |
| `file_name` | TEXT | original filename |
| `file_type` | TEXT | MIME (verified: `image/webp`) |
| `file_size` | INTEGER | bytes |
| `folder` | TEXT | free-form, sanitized |
| `alt_text` | TEXT | optional |
| `caption` | TEXT | optional |
| `uploaded_at` | TEXT | `CURRENT_TIMESTAMP` default |
| `deleted_at` | TEXT | soft-delete |

Indexes: `idx_media_folder`, `idx_media_deleted_at`.

**Data (Codespace DB):**
- 36 total rows
- 36 with `folder = 'posts'`
- 0 with `deleted_at IS NOT NULL`
- 0 with `folder = 'library'`

**Disk:**
- `public/uploads/posts/` — 20+ visible `.webp` files (screenshots from testing)
- `public/uploads/library/` — 1 PDF (`DSLAP-Japan-Travel-Itinerary-2026.pdf`)
- **The PDF on disk has no `media` row.** Placed manually, likely for a demo. Orphaned file, harmless.

### 2.2 `content_library` table

Schema (`drizzle/schema/content-library.ts`):

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK | |
| `title` | TEXT NOT NULL | |
| `description` | TEXT | |
| `type` | TEXT NOT NULL | `pdf`, `image`, `text` |
| `category` | TEXT | `guide`, `checklist`, `faq`, `alert`, `document`, `other` |
| `file_path` | TEXT | for pdf/image types |
| `text_content` | TEXT | for text type |
| `created_at` | TEXT | |
| `deleted_at` | TEXT | soft-delete |

FK: `portal_items.content_library_id` → `content_library.id`.

**Data:** 0 rows. Empty.

**Purpose:** Portal-delivery content — items attached to a client portal wall. Categories (checklist, FAQ, alert) and `text_content` make it portal-specific.

### 2.3 Write paths

**Into `media`:**
- `/api/upload` (`app/api/upload/route.ts`) — accepts `file`, `folder`, `altText`, `caption` form fields. Calls `saveFile(file, folder)` (disk) then `addMediaRecord({...})` (DB). Returns `{ success, mediaId, filePath }`.
- Called from: `ImageSourcePicker` (upload mode), `BulkUploadZone` (Gallery editor H2 chunk 2), admin `/admin/media` upload form (`uploadMediaAction`).

**Into `content_library`:**
- `/api/content-library` POST — accepts title, description, type, category, filePath, textContent. Called from `AddContentModal`. Never called in production use.
- Admin `/admin/content-library` page has an add form via server action.

### 2.4 Read paths

**From `media`:**
- `/admin/media` page — `getMediaByFolder()` (returns all rows ordered). Table shows preview, name, folder, type, uploaded date, delete button.
- `StorageUsage` widget on admin dashboard — `getStorageUsage().totalSize`. Counts all `media` bytes.

**From `content_library`:**
- `/api/content-library` GET — `getLibraryItems({category, search})`. Called from `/admin/content-library` page and `AttachLibraryModal` (portal wall attachment).

**From `ImageSourcePicker`:**
- Reads nothing. Only writes to `media` via upload, or accepts a URL via paste.

### 2.5 Picker modes

`ImageSourcePicker.tsx`:
- `"upload"` — single file, POST `/api/upload`, sets value to `/uploads/<filePath>`
- `"url"` — text input, accepts `https://...` or `/uploads/...`

**No library mode.** Files uploaded from pickers are written to `media` and then never surfaced for reuse.

### 2.6 `portal_items` relationship

`portal_items.content_library_id` is a real FK to `content_library.id`. Portal wall rendering path: portal → `portal_items` → `content_library` → file URL. This chain is designed for portal delivery, not for general file reuse.

---

## 3. What Was Intended

Verbatim from Myah (this conversation):

> "there's a storage bank that automatically saves uploads to it and tells me the total usage size and how many files. The library was supposed to house these files so i can see them, organize them and delete the unwanted ones. Systems missing now are pretty much all of that along with the ability to upload a file and not save it or recall already saved files in a later upload. It was a system i guess i just threw in there without fleshing it."

Decomposed into requirements:

**The storage bank exists:**
- ✅ Every upload auto-saved to `media` + disk
- ✅ Total usage size shown (StorageUsage widget)
- ✅ File count shown (also StorageUsage widget)

**The library was supposed to:**
- ❌ See all stored files in a dedicated UI
- ❌ Organize them (folders, tags, categories — mechanism TBD)
- ❌ Delete unwanted ones (single + bulk)
- ❌ Edit file metadata (rename, alt, caption)
- ❌ Upload a file and **not** save it to library (transient upload)
- ❌ **Recall** an already-saved file when uploading later

**What "not save it" means (interpretation, per Myah's follow-up):**
- Easy interpretation: **all uploads live in `media`; only some are marked `is_library = 1`**. The library view shows flagged files. Unflagged files exist and are usable by the post that uploaded them, but not visible in the library for reuse.
- Hard interpretation (rejected): temp files tracked, reference-counted, garbage-collected. Overkill for single-admin; not the intent.

---

## 4. Gap Analysis

| Requirement | Status | Gap |
|---|---|---|
| Auto-save uploads to storage | ✅ Works | None |
| Total usage size shown | ✅ Works | None |
| File count shown | ✅ Works | None |
| See all stored files | ⚠️ Partial | `/admin/media` lists them in a table, no grid, no search, no filter |
| Organize | ❌ Missing | No folder UI, no tags, no categories |
| Delete (single) | ✅ Works | Via `/admin/media` per-row delete |
| Delete (bulk) | ❌ Missing | No selection, no multi-delete |
| Edit metadata | ❌ Missing | No UI for alt, caption, folder, name |
| Save to library on upload | ❌ Missing | No flag, no checkbox |
| Pick from library on reuse | ❌ Missing | Picker has no library mode |
| Distinguish library vs transient | ❌ Missing | No `is_library` column |

**Fracturing observed:**
- `/admin/media` is titled "Media Library" but offers no library features
- `/admin/content-library` is a separate portal-delivery page — different concept, empty, adds confusion in nav ("Media Library" vs "Content Library")
- `ImageSourcePicker` uploads to `media` but never reads from it, forcing re-upload
- No way to "save" a file as library vs "upload and use once"

---

## 5. Proposed Model — Decision

Three viable models. Recommendation and reasoning below.

### Option A (Recommended) — `is_library` flag on `media`, `/admin/media` becomes the library page

- Add `is_library INTEGER NOT NULL DEFAULT 0` (Drizzle: `{ mode: "boolean" }`) to `media`
- `/admin/media` gains: grid/list toggle, search by filename, filter by folder, filter by saved/unsaved, bulk delete, per-row edit (alt/caption/folder), storage usage widget, file count, saved count, `is_library` toggle per row
- `ImageSourcePicker` gains third mode "From library" — browse grid of `is_library = 1` files, search, pagination, click-to-select
- Picker's upload mode gains "Save to library" checkbox (default OFF, remembered in localStorage)
- `content_library` untouched

**Pros:**
- One page for Myah (`/admin/media`, already titled "Media Library")
- One mental model: "the library is my uploaded files, some flagged for reuse"
- Migration: one column, no data reorganization
- Files and metadata stay together
- `content_library` remains as its own portal concept, no merge

**Cons:**
- Nav has "Media Library" and "Content Library" — two library-ish pages (mitigated by documenting that Content Library = portal delivery)
- File metadata (name, alt, caption) is on `media`; portal-facing content (title, description, category) is on `content_library` — different fields for different purposes, may confuse

### Option B — New `/admin/library` page, `/admin/media` stays raw

- Add `is_library` flag on `media`
- `/admin/library` — new page, library management (grid, search, bulk, edit, storage)
- `/admin/media` — unchanged, stays as raw file dump with upload form + table
- Picker browses `is_library = 1`
- `content_library` untouched

**Pros:**
- Clear separation: `/admin/media` = raw storage, `/admin/library` = curated
- Doesn't change existing admin page behavior

**Cons:**
- Two new admin surfaces (media + library) where one would do
- More nav items
- Confusing for a single-admin app — "why are there 3 admin pages about files?"
- `/admin/media` becomes dead weight (still listing every file but offering no new features)

### Option C (Rejected) — Expand `content_library` to house media

- Migrate `media` rows into `content_library`, add file_type/file_size/etc. columns
- `content_library` becomes the library
- `media` retired

**Pros:**
- "Library was supposed to house these files" fits literally

**Cons:**
- `content_library` has a real FK into `portal_items` — schema changes cascade to portal rendering
- `content_library`'s schema (title, category, text_content) doesn't fit general file storage
- 36 media rows + 0 content_library rows means the migration is purely additive but the semantic split is wrong — portal items should reference portal-specific content, not every uploaded file
- Bigger migration, higher risk, no clear benefit over A

### Recommendation: Option A

The storefront belongs on `/admin/media`. It's already the "see all files" page — it just needs to become usable. `content_library` is genuinely a different concept (portal delivery), and mixing it in would recreate the fragmentation, not fix it.

---

## 6. What This Batch Does Not Fix

**Out of scope (potential future batches):**

- **Reference tracking.** No way to know if a `media` file is referenced by a post, portal, or page. Deleting a file that a live post references breaks the post. Currently a latent risk. Batch K+ candidate.
- **Orphaned file cleanup.** Files on disk without `media` rows (the DSLAP PDF today). A maintenance script.
- **Deduplication.** Same file uploaded twice = two disk copies + two rows. Hash-based dedup is a Batch K+ candidate.
- **Folder UI.** The `folder` column exists but there's no UI to manage folders. Batch J will add a folder filter, not folder management.
- **`content_library` refactor.** Its current 0-row state and portal FK stay as-is.
- **Storage quotas.** No per-folder or per-type limits.
- **Image format conversion.** Uploads are converted to `.webp` by `sharp` at 1920x1920 max. No thumbnail generation.

---

## 7. Implementation Batches

Three batches, sequential, each independently shippable:

### Batch I — Picker "From library" mode (~4h)

**Delivers:**
- `is_library` column on `media` (schema + migration + `addMediaRecord` update)
- `GET /api/media` list endpoint (scope=library|all, search, pagination, auth)
- `PATCH /api/media/:id` promote/demote endpoint
- `MediaLibraryPicker` modal (grid, Saved/All tabs, search, star-to-promote, load more, `<dialog>` primitive)
- `ImageSourcePicker` "From library" third mode
- Upload checkbox "Save to library" + localStorage persistence
- `buildPublicUrl()` helper deduplicating the URL ternary

### Batch J — Admin library page (~6h)

**Depends on:** Batch I's `is_library` flag.

**Delivers:**
- `/admin/media` page gains: storage usage widget + file count at top
- Saved count / total count split
- Grid view toggle in addition to table view
- Search by filename, filter by folder, filter by saved/unsaved
- Bulk selection + bulk delete (with confirm)
- Per-row edit modal (alt, caption, folder, is_library toggle)
- Pagination

### Batch K — Content library cleanup (~2h, or fold into J)

**Delivers:**
- Confirm `content_library` remains separate and documented
- Delete the orphaned PDF OR create a matching `media` row
- Update `MASTER-PROMPT.md` with the two-libraries distinction

---

## 8. Verification Targets

**Batch I verification:**
- `tsc --noEmit` clean
- `npm test` still 135 passing
- Migration applies to DB copy without errors
- `GET /api/media?scope=library` returns empty before starring, populated after
- `PATCH /api/media/:id` with `{ isLibrary: true }` returns 200, row updates
- Picker modal opens, loads, stars/unstars, selects, closes
- Upload with checkbox ticked appears in Saved view
- Upload with checkbox unchecked appears in All view only

**Batch J verification:**
- Storage widget and file count visible on `/admin/media`
- Bulk select + bulk delete works
- Edit modal saves alt/caption/folder
- Search filters table live
- Grid view shows thumbnails
- Pagination navigates pages

**Batch K verification:**
- Orphaned PDF handled per decision
- `MASTER-PROMPT.md` updated
- No regression in other admin pages

---

## 9. Decision Required

Before Batch I code starts:

1. **Confirm Option A** — `is_library` flag on `media`, `/admin/media` becomes the library page, `content_library` untouched. Or choose B.
2. **Confirm Batch split** — I, then J, then K. Or merge J+K.
3. **Confirm what "organize" means** — folders only (use existing `folder` column), or folders + tags? My rec: folders only in Batch J. Tags are a separate feature.

Answer these three and `docs/BATCH-I-PLAN.md` gets written reflecting the audit's findings.

---

**End of audit.**
