#!/usr/bin/env bash
# Media API coverage — list, filter, search, pagination, promote, move.
# Upload endpoint not tested here (needs a real file); covered in browser.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

require_server

suite_begin "media"

# Ensure clean folder state for move tests
db_query "UPDATE media SET folder_id = NULL WHERE folder_id IS NOT NULL;" || true
db_query "DELETE FROM folders;" || true

echo
echo "-- List --"
RESP=$(http_get "/api/media?scope=all")
check_not_empty "scope=all returns items" "$(echo "$RESP" | jget "total")"
TOTAL_ALL=$(echo "$RESP" | jget "total")
TOTAL_IN_DB=$(db_count "SELECT COUNT(*) FROM media WHERE deleted_at IS NULL AND file_type LIKE 'image/%';")
check "scope=all total matches DB" "$TOTAL_IN_DB" "$TOTAL_ALL"

RESP=$(http_get "/api/media?scope=library")
TOTAL_LIB=$(echo "$RESP" | jget "total")
TOTAL_LIB_DB=$(db_count "SELECT COUNT(*) FROM media WHERE deleted_at IS NULL AND is_library = 1 AND file_type LIKE 'image/%';")
check "scope=library total matches DB" "$TOTAL_LIB_DB" "$TOTAL_LIB"

echo
echo "-- Search --"
RESP=$(http_get "/api/media?scope=all&q=Screenshot")
Q_TOTAL=$(echo "$RESP" | jget "total")
check "search for 'Screenshot' returns >0" "1" "$([ "${Q_TOTAL:-0}" -gt 0 ] && echo 1 || echo 0)"

RESP=$(http_get "/api/media?scope=all&q=__NOMATCH__XYZ__")
check "search for nonsense returns 0" "0" "$(echo "$RESP" | jget "total")"

# LIKE escape: `%` should be literal, not wildcard
RESP=$(http_get "/api/media?scope=all&q=%25")
check "literal % doesn't match everything" "0" "$(echo "$RESP" | jget "total")"

echo
echo "-- Pagination --"
RESP=$(http_get "/api/media?scope=all&limit=5")
LEN=$(echo "$RESP" | jlen_items)
check "limit=5 returns 5 items or total" "1" "$([ "$LEN" -le 5 ] && echo 1 || echo 0)"

RESP=$(http_get "/api/media?scope=all&limit=999")
LEN=$(echo "$RESP" | jlen_items)
check "limit=999 capped at 48" "1" "$([ "$LEN" -le 48 ] && echo 1 || echo 0)"

RESP1=$(http_get "/api/media?scope=all&limit=3&offset=0")
RESP2=$(http_get "/api/media?scope=all&limit=3&offset=3")
ID1=$(echo "$RESP1" | jfirst_id)
ID2=$(echo "$RESP2" | jfirst_id)
check "offset pagination returns different items" "1" "$([ "$ID1" != "$ID2" ] && echo 1 || echo 0)"

echo
echo "-- Promote / demote --"
# Pick any media id
MID=$(db_count "SELECT MIN(id) FROM media WHERE deleted_at IS NULL;")
if [ -z "$MID" ] || [ "$MID" = "0" ]; then
  echo "    (skip) no media rows to promote"
else
  # Demote first to ensure clean state
  db_query "UPDATE media SET is_library = 0 WHERE id = $MID;"

  RESP=$(http_post "/api/media/$MID" '{"isLibrary":true}')
  # PATCH not POST — fix
  RESP=$(http_patch "/api/media/$MID" '{"isLibrary":true}')
  check "PATCH promote returns success" "true" "$(echo "$RESP" | jget "isLibrary")"
  check "is_library set in DB" "1" "$(db_count "SELECT is_library FROM media WHERE id = $MID;")"

  RESP=$(http_patch "/api/media/$MID" '{"isLibrary":false}')
  check "PATCH demote returns success" "false" "$(echo "$RESP" | jget "isLibrary")"
  check "is_library cleared in DB" "0" "$(db_count "SELECT is_library FROM media WHERE id = $MID;")"

  echo
  echo "-- Validation --"
  STATUS=$(http_status PATCH "/api/media/$MID" '{"isLibrary":"true"}')
  check "string isLibrary rejected (400)" "400" "$STATUS"

  STATUS=$(http_status PATCH "/api/media/$MID" '{"isLibrary":1}')
  check "number isLibrary rejected (400)" "400" "$STATUS"

  STATUS=$(http_status PATCH "/api/media/abc" '{"isLibrary":true}')
  check "invalid id rejected (400)" "400" "$STATUS"

  STATUS=$(http_status PATCH "/api/media/999999" '{"isLibrary":true}')
  check "missing media rejected (404)" "404" "$STATUS"

  echo
  echo "-- Move --"
  # Create a folder for the move test
  FID=$(http_post "/api/folders" '{"name":"__AUDIT_MEDIA_TEST__"}' | jget "folder.id")
  check "test folder created" "1" "$([ -n "$FID" ] && echo 1 || echo 0)"

  RESP=$(http_post "/api/media/$MID/move" "{\"folderId\":$FID}")
  check "move to folder returns success" "true" "$(echo "$RESP" | jget "success")"
  check "media.folder_id set" "$FID" "$(db_count "SELECT folder_id FROM media WHERE id = $MID;")"

  RESP=$(http_post "/api/media/$MID/move" '{"folderId":null}')
  check "move to root returns success" "true" "$(echo "$RESP" | jget "success")"
  check "media.folder_id cleared" "NULL" "$(db_nullable "$(db_count "SELECT folder_id FROM media WHERE id = $MID;")")"

  STATUS=$(http_status POST "/api/media/$MID/move" '{"folderId":999999}')
  check "move to invalid folder rejected (400)" "400" "$STATUS"

  # Cleanup
  http_delete "/api/folders/$FID" > /dev/null
fi

# Final cleanup
db_query "UPDATE media SET folder_id = NULL WHERE folder_id IS NOT NULL;" || true
db_query "UPDATE media SET is_library = 0 WHERE is_library = 1;" || true
db_query "DELETE FROM folders;" || true

suite_end
