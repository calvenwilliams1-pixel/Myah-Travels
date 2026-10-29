#!/usr/bin/env bash
# Data integrity invariants.
# No API calls — pure DB queries + filesystem checks.
# Catches orphaned rows, broken FKs, soft-delete leakage, duplicates.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/../..")"

suite_begin "integrity"

# --- Orphaned media rows (DB row, no disk file) ---
echo
echo "-- Orphaned media rows --"
ORPHAN_ROWS=$(db_query "SELECT file_path FROM media WHERE deleted_at IS NULL;")
ORPHAN_COUNT=0
while IFS= read -r fp; do
  [ -z "$fp" ] && continue
  if [ ! -f "public/uploads/$fp" ]; then
    ORPHAN_COUNT=$((ORPHAN_COUNT + 1))
    echo "    orphaned DB row: media.file_path=$fp (no disk file)"
  fi
done <<< "$ORPHAN_ROWS"
check "media rows all have disk files" "0" "$ORPHAN_COUNT"

# --- Orphaned disk files (disk file, no DB row) ---
echo
echo "-- Orphaned disk files --"
DISK_ORPHAN=0
if [ -d "public/uploads/posts" ]; then
  while IFS= read -r f; do
    relpath="${f#public/uploads/}"
    exists=$(db_count "SELECT COUNT(*) FROM media WHERE file_path = '$relpath' AND deleted_at IS NULL;")
    if [ "$exists" = "0" ]; then
      DISK_ORPHAN=$((DISK_ORPHAN + 1))
      echo "    orphaned disk file: public/uploads/$relpath (no DB row)"
    fi
  done < <(find public/uploads/posts -type f 2>/dev/null)
fi
check "disk files all have media rows" "0" "$DISK_ORPHAN"

# --- FK integrity: portal_items.content_library_id ---
echo
echo "-- FK integrity: portal_items → content_library --"
FK_BAD=$(db_count "SELECT COUNT(*) FROM portal_items WHERE content_library_id IS NOT NULL AND content_library_id NOT IN (SELECT id FROM content_library WHERE deleted_at IS NULL);")
check "portal_items content_library_id all valid" "0" "$FK_BAD"

# --- FK integrity: media.folder_id ---
echo
echo "-- FK integrity: media → folders --"
FK_BAD=$(db_count "SELECT COUNT(*) FROM media WHERE folder_id IS NOT NULL AND folder_id NOT IN (SELECT id FROM folders WHERE deleted_at IS NULL);")
check "media folder_id all valid (alive folders)" "0" "$FK_BAD"

# --- FK integrity: folders.parent_id ---
echo
echo "-- FK integrity: folders → folders --"
FK_BAD=$(db_count "SELECT COUNT(*) FROM folders WHERE parent_id IS NOT NULL AND parent_id NOT IN (SELECT id FROM folders WHERE deleted_at IS NULL);")
check "folders parent_id all valid (alive parents)" "0" "$FK_BAD"

# --- Folder cycles (self-parent, or A->B->A) ---
echo
echo "-- Folder cycle detection --"
SELF_PARENT=$(db_count "SELECT COUNT(*) FROM folders WHERE parent_id = id AND deleted_at IS NULL;")
check "no self-parented folders" "0" "$SELF_PARENT"

# Two-level cycle: A.parent=B and B.parent=A
TWO_CYCLE=$(db_count "SELECT COUNT(*) FROM folders a JOIN folders b ON a.parent_id = b.id WHERE b.parent_id = a.id AND a.deleted_at IS NULL AND b.deleted_at IS NULL;")
check "no two-folder cycles" "0" "$TWO_CYCLE"

# --- Soft-delete consistency: deleted items shouldn't appear in lists ---
echo
echo "-- Soft-delete consistency --"
# Posts with deleted_at that still show in normal query
POSTS_LEAK=$(db_count "SELECT COUNT(*) FROM posts WHERE deleted_at IS NOT NULL AND published = 1;")
check "no soft-deleted posts still published" "0" "$POSTS_LEAK"

# Media with deleted_at showing in folder_id groupings
MEDIA_LEAK=$(db_count "SELECT COUNT(*) FROM media WHERE deleted_at IS NOT NULL AND folder_id IS NOT NULL;")
check "no soft-deleted media with active folder assignment" "0" "$MEDIA_LEAK"

# --- Required fields populated ---
echo
echo "-- Required fields --"
BAD_TITLES=$(db_count "SELECT COUNT(*) FROM posts WHERE (title IS NULL OR title = '') AND deleted_at IS NULL;")
check "no posts with empty title" "0" "$BAD_TITLES"

BAD_PATHS=$(db_count "SELECT COUNT(*) FROM media WHERE (file_path IS NULL OR file_path = '') AND deleted_at IS NULL;")
check "no media with empty file_path" "0" "$BAD_PATHS"

BAD_FOLDER_NAMES=$(db_count "SELECT COUNT(*) FROM folders WHERE (name IS NULL OR name = '') AND deleted_at IS NULL;")
check "no folders with empty name" "0" "$BAD_FOLDER_NAMES"

# --- User exists ---
echo
echo "-- Required entities --"
USER_COUNT=$(db_count "SELECT COUNT(*) FROM users;")
check "at least one user exists" "1" "$([ "$USER_COUNT" -ge 1 ] && echo 1 || echo 0)"

# --- Settings populated ---
echo
echo "-- Required settings --"
for key in site_name primary_color; do
  setting_exists=$(db_count "SELECT COUNT(*) FROM settings WHERE key = '$key';")
  check "setting '$key' exists" "1" "$setting_exists"
done

# --- Duplicate detection (where uniqueness implied) ---
echo
echo "-- Duplicate detection --"
DUP_FOLDER_NAMES=$(db_query "SELECT COUNT(*) FROM (SELECT name, parent_id FROM folders WHERE deleted_at IS NULL GROUP BY name, IFNULL(parent_id, -1) HAVING COUNT(*) > 1);")
check "no duplicate folder names in same parent" "0" "${DUP_FOLDER_NAMES:-0}"

# --- Disk quota sanity ---
echo
echo "-- Disk usage --"
if [ -d "public/uploads" ]; then
  UPLOAD_SIZE=$(du -sm public/uploads 2>/dev/null | awk '{print $1}')
  check "uploads dir present" "1" "$([ -d public/uploads ] && echo 1 || echo 0)"
  echo "    (info) public/uploads total size: ${UPLOAD_SIZE:-0} MB"
fi

suite_end
