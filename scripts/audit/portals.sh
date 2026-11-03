#!/usr/bin/env bash
# Portal API audit. Seeds portal + content_library via SQL (no POST
# routes for those), then exercises items, reorder, visibility, delete.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

require_server
suite_begin "portals"

cleanup() {
  db_query "DELETE FROM portal_items WHERE portal_id IN (SELECT id FROM portals WHERE name LIKE '__AUDIT_%');" 2>/dev/null
  db_query "DELETE FROM portal_members WHERE portal_id IN (SELECT id FROM portals WHERE name LIKE '__AUDIT_%');" 2>/dev/null
  db_query "DELETE FROM portals WHERE name LIKE '__AUDIT_%';" 2>/dev/null
  db_query "DELETE FROM content_library WHERE title LIKE '__AUDIT_%';" 2>/dev/null
  db_query "DELETE FROM itineraries WHERE title LIKE '__AUDIT_%';" 2>/dev/null
}
trap cleanup EXIT
cleanup

echo "-- Seed fixtures --"
PORTAL_ID=$(db_scalar "INSERT INTO portals (name, slug) VALUES ('__AUDIT_Portal__', '__audit_portal__') RETURNING id;")
check_not_empty "portal seeded" "$PORTAL_ID"

LIB_ID=$(db_scalar "INSERT INTO content_library (title, type) VALUES ('__AUDIT_LibItem__', 'text') RETURNING id;")
check_not_empty "content_library item seeded" "$LIB_ID"

echo
echo "-- GET portal --"
RESP=$(http_get "/api/portal/$PORTAL_ID")
check "portal name correct" "__AUDIT_Portal__" "$(echo "$RESP" | jget "portal.name")"

echo
echo "-- Attach library item --"
RESP=$(http_post "/api/portal/$PORTAL_ID/items" "{\"contentLibraryId\":$LIB_ID}")
check "attach returns success" "true" "$(echo "$RESP" | jget "success")"
check "library item in portal_items" "1" "$(db_count "SELECT COUNT(*) FROM portal_items WHERE portal_id=$PORTAL_ID AND source_type='library';")"

echo
echo "-- Add portal-specific item --"
RESP=$(http_post "/api/portal/$PORTAL_ID/items" '{"title":"__AUDIT_Specific__","type":"text","textContent":"Hello from audit"}')
check "portal-specific add returns success" "true" "$(echo "$RESP" | jget "success")"
SPEC_ID=$(echo "$RESP" | jget "itemId")
check_not_empty "portal-specific itemId" "$SPEC_ID"
check "portal-specific in portal_items" "1" "$(db_count "SELECT COUNT(*) FROM portal_items WHERE portal_id=$PORTAL_ID AND source_type='portal_specific';")"

echo
echo "-- GET items list --"
RESP=$(http_get "/api/portal/$PORTAL_ID/items")
check "GET items returns 2" "2" "$(echo "$RESP" | jlen_items)"

echo
echo "-- Reorder --"
# Reorder: put specific item first, library item second
LIB_PI_ID=$(db_scalar "SELECT id FROM portal_items WHERE portal_id=$PORTAL_ID AND source_type='library';")
RESP=$(http_post "/api/portal/$PORTAL_ID/reorder" "{\"orderedIds\":[$SPEC_ID,$LIB_PI_ID]}")
check "reorder returns success" "true" "$(echo "$RESP" | jget "success")"
FIRST_ORDER=$(db_scalar "SELECT id FROM portal_items WHERE portal_id=$PORTAL_ID ORDER BY position ASC LIMIT 1;")
check "specific item now first" "$SPEC_ID" "$FIRST_ORDER"

echo
echo "-- Visibility toggle --"
RESP=$(http_patch "/api/portal/$PORTAL_ID/items/$SPEC_ID/visibility" '{"isVisible":false}')
check "visibility toggle returns success" "true" "$(echo "$RESP" | jget "success")"
check "is_visible=false in DB" "0" "$(db_count "SELECT is_visible FROM portal_items WHERE id=$SPEC_ID;")"

RESP=$(http_patch "/api/portal/$PORTAL_ID/items/$SPEC_ID/visibility" '{"isVisible":true}')
check "visibility restore returns success" "true" "$(echo "$RESP" | jget "success")"

echo
echo "-- Delete item --"
RESP=$(http_delete "/api/portal/$PORTAL_ID/items/$SPEC_ID")
check "delete item returns success" "true" "$(echo "$RESP" | jget "success")"
check "specific item gone from DB" "0" "$(db_count "SELECT COUNT(*) FROM portal_items WHERE id=$SPEC_ID;")"

echo
echo "-- Attach itinerary --"
ITIN_ID=$(db_scalar "INSERT INTO itineraries (portal_id, title, created_at) VALUES ($PORTAL_ID, '__AUDIT_Portal_Itin__', CURRENT_TIMESTAMP) RETURNING id;")
check_not_empty "itinerary seeded" "$ITIN_ID"

RESP=$(http_post "/api/itineraries/$ITIN_ID/attach" "{\"portalId\":$PORTAL_ID}")
check "attach itinerary returns success" "true" "$(echo "$RESP" | jget "success")"
check "itinerary in portal_items" "1" "$(db_count "SELECT COUNT(*) FROM portal_items WHERE portal_id=$PORTAL_ID AND source_type='itinerary';")"

echo
echo "-- Validation --"
STATUS=$(http_status POST "/api/portal/$PORTAL_ID/items" '{"title":""}')
check "empty item title rejected (400)" "400" "$STATUS"

STATUS=$(http_status POST "/api/portal/$PORTAL_ID/items" '{"contentLibraryId":99999}')
check "missing library item rejected" "1" "$([ "$STATUS" != "200" ] && echo 1 || echo 0)"

STATUS=$(http_post "/api/portal/$PORTAL_ID/reorder" '{"orderedIds":"not-an-array"}' | jget "error")
check "invalid reorder rejected" "true" "$([ -n "$STATUS" ] && echo true || echo false)"

suite_end
