#!/usr/bin/env bash
# Foreign key policy audit.
# 1. Verify app enables PRAGMA foreign_keys.
# 2. List every FK in the DB with its ON DELETE policy.
# 3. Report portal children FK policies (CASCADE vs NO ACTION).
# 4. Check for orphaned children (any FK violation at rest).
#
# NOTE: this script uses the sqlite3 CLI, which has PRAGMA foreign_keys = OFF.
# We do NOT attempt to test cascade behavior by insert/delete here — that
# requires the app's better-sqlite3 connection, which a bash script can't
# easily access. Cascade behavior verification is a Node-script or vitest task.
# What we CAN verify from CLI: FK declarations, policy metadata, orphan state.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/../..")"

suite_begin "fk-audit"

echo "-- App-side PRAGMA foreign_keys --"
if grep -q 'pragma("foreign_keys = ON")' lib/db/index.ts 2>/dev/null; then
  check "app enables PRAGMA foreign_keys" "1" "1"
else
  check "app enables PRAGMA foreign_keys" "1" "0"
fi

echo
echo "-- FKs declared in the live database --"
TABLES=$(db_query "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
TOTAL_FK=0
FK_NO_POLICY=0

while IFS= read -r table; do
  [ -z "$table" ] && continue
  FKS=$(db_query "PRAGMA foreign_key_list($table);")
  [ -z "$FKS" ] && continue
  while IFS='|' read -r id seq parent from to on_update on_delete match; do
    [ -z "$id" ] && continue
    TOTAL_FK=$((TOTAL_FK + 1))
    POLICY="$on_delete"
    if [ -z "$POLICY" ] || [ "$POLICY" = "NO ACTION" ]; then
      FK_NO_POLICY=$((FK_NO_POLICY + 1))
    fi
  done <<< "$FKS"
done <<< "$TABLES"

check "at least 10 FKs exist" "1" "$([ "$TOTAL_FK" -ge 10 ] && echo 1 || echo 0)"
echo "    (info) $TOTAL_FK total FK constraints, $FK_NO_POLICY with NO ACTION"

echo
echo "-- Portal children FK policies --"
PORTAL_FK_CASCADE_OK=0
PORTAL_FK_NEEDS_MIGRATION=0

for table in portal_members portal_magic_links portal_sessions portal_documents portal_notices portal_faqs portal_checklist_states portal_items itineraries notepad_entries; do
  POLICY=$(db_scalar "SELECT on_delete FROM pragma_foreign_key_list('$table') WHERE \"table\" = 'portals';" | tr -d '[:space:]')
  case "$POLICY" in
    CASCADE)
      echo "    OK  $table.portal_id -> portals.id [CASCADE]"
      PORTAL_FK_CASCADE_OK=$((PORTAL_FK_CASCADE_OK + 1))
      ;;
    SETNULL)
      echo "    OK  $table.portal_id -> portals.id [SET NULL]"
      PORTAL_FK_CASCADE_OK=$((PORTAL_FK_CASCADE_OK + 1))
      ;;
    NOACTION)
      echo "    REVIEW  $table.portal_id -> portals.id [NO ACTION — needs migration to CASCADE]"
      PORTAL_FK_NEEDS_MIGRATION=$((PORTAL_FK_NEEDS_MIGRATION + 1))
      ;;
    "")
      echo "    REVIEW  $table.portal_id -> portals.id [no FK declared]"
      PORTAL_FK_NEEDS_MIGRATION=$((PORTAL_FK_NEEDS_MIGRATION + 1))
      ;;
    *)
      echo "    INFO  $table.portal_id -> portals.id [$POLICY]"
      PORTAL_FK_CASCADE_OK=$((PORTAL_FK_CASCADE_OK + 1))
      ;;
  esac
done

echo "    (info) $PORTAL_FK_CASCADE_OK proper FK, $PORTAL_FK_NEEDS_MIGRATION need migration"

echo
echo "-- Orphan check (FK violations at rest) --"
ORPHAN_TOTAL=0

O=$(db_count "SELECT COUNT(*) FROM portal_items WHERE content_library_id IS NOT NULL AND content_library_id NOT IN (SELECT id FROM content_library);")
[ "$O" -gt 0 ] && echo "    $O portal_items -> content_library orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM portal_items WHERE portal_id NOT IN (SELECT id FROM portals);")
[ "$O" -gt 0 ] && echo "    $O portal_items -> portals orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM portal_members WHERE portal_id NOT IN (SELECT id FROM portals);")
[ "$O" -gt 0 ] && echo "    $O portal_members -> portals orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM portal_magic_links WHERE portal_id NOT IN (SELECT id FROM portals);")
[ "$O" -gt 0 ] && echo "    $O portal_magic_links -> portals orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM media WHERE folder_id IS NOT NULL AND folder_id NOT IN (SELECT id FROM folders);")
[ "$O" -gt 0 ] && echo "    $O media -> folders orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM itinerary_sections WHERE itinerary_id NOT IN (SELECT id FROM itineraries);")
[ "$O" -gt 0 ] && echo "    $O itinerary_sections -> itineraries orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM itinerary_days WHERE section_id NOT IN (SELECT id FROM itinerary_sections);")
[ "$O" -gt 0 ] && echo "    $O itinerary_days -> itinerary_sections orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM itinerary_segments WHERE day_id NOT IN (SELECT id FROM itinerary_days);")
[ "$O" -gt 0 ] && echo "    $O itinerary_segments -> itinerary_days orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

O=$(db_count "SELECT COUNT(*) FROM itinerary_stays WHERE section_id NOT IN (SELECT id FROM itinerary_sections);")
[ "$O" -gt 0 ] && echo "    $O itinerary_stays -> itinerary_sections orphans" && ORPHAN_TOTAL=$((ORPHAN_TOTAL + O))

check "no FK orphans at rest" "0" "$ORPHAN_TOTAL"

suite_end
