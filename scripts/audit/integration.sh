#!/usr/bin/env bash
# Cross-subsystem integration: itinerary → portal.
# Verifies that an itinerary attached to a portal appears as a portal
# item, resolves correctly, and coexists with other item types.
# Also tests what happens when the itinerary is soft-deleted while attached.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

require_server
suite_begin "integration"

cleanup() {
  db_query "DELETE FROM portal_items WHERE portal_id IN (SELECT id FROM portals WHERE name LIKE '__AUDIT_INT_%');" 2>/dev/null
  db_query "DELETE FROM itinerary_segments WHERE day_id IN (SELECT id FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE title LIKE '__AUDIT_INT_%')));" 2>/dev/null
  db_query "DELETE FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE title LIKE '__AUDIT_INT_%'));" 2>/dev/null
  db_query "DELETE FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE title LIKE '__AUDIT_INT_%');" 2>/dev/null
  db_query "DELETE FROM itineraries WHERE title LIKE '__AUDIT_INT_%';" 2>/dev/null
  db_query "DELETE FROM portals WHERE name LIKE '__AUDIT_INT_%';" 2>/dev/null
  db_query "DELETE FROM content_library WHERE title LIKE '__AUDIT_INT_%';" 2>/dev/null
}
trap cleanup EXIT
cleanup

echo "-- Seed portal + itinerary --"
PORTAL_ID=$(db_scalar "INSERT INTO portals (name, slug) VALUES ('__AUDIT_INT_Portal__', '__audit_int_portal__') RETURNING id;")
check_not_empty "portal seeded" "$PORTAL_ID"

ITIN_ID=$(db_scalar "INSERT INTO itineraries (portal_id, title, created_at) VALUES ($PORTAL_ID, '__AUDIT_INT_Itinerary__', CURRENT_TIMESTAMP) RETURNING id;")
check_not_empty "itinerary seeded" "$ITIN_ID"

echo
echo "-- Populate itinerary --"
SEC=$(http_post "/api/itineraries/$ITIN_ID/sections" '{"title":"__AUDIT_INT_Section__","baseCity":"Paris","startDate":"2026-07-01","endDate":"2026-07-03"}')
SEC_ID=$(echo "$SEC" | jget "section.id")
check_not_empty "section created" "$SEC_ID"

DAY=$(http_post "/api/sections/$SEC_ID/days" '{"date":"2026-07-01","dayNumber":1}')
DAY_ID=$(echo "$DAY" | jget "day.id")
check_not_empty "day created" "$DAY_ID"

SEG=$(http_post "/api/days/$DAY_ID/segments" '{"type":"activity","title":"__AUDIT_INT_Segment__","location":"Eiffel Tower"}')
SEG_ID=$(echo "$SEG" | jget "segment.id")
check_not_empty "segment created" "$SEG_ID"

echo
echo "-- Attach itinerary to portal --"
RESP=$(http_post "/api/itineraries/$ITIN_ID/attach" "{\"portalId\":$PORTAL_ID}")
check "attach returns success" "true" "$(echo "$RESP" | jget "success")"

ITIN_PI=$(db_scalar "SELECT id FROM portal_items WHERE portal_id=$PORTAL_ID AND source_type='itinerary' AND itinerary_id=$ITIN_ID;")
check_not_empty "itinerary in portal_items" "$ITIN_PI"

echo
echo "-- Portal items show itinerary --"
RESP=$(http_get "/api/portal/$PORTAL_ID/items")
check "portal has 1 item" "1" "$(echo "$RESP" | jlen_items)"
check "item is itinerary sourceType" "itinerary" "$(echo "$RESP" | jget "items.0.sourceType")"

echo
echo "-- Itinerary GET shows portal reference --"
RESP=$(http_get "/api/itineraries/$ITIN_ID")
check "itinerary portal name" "__AUDIT_INT_Portal__" "$(echo "$RESP" | jget "portal.name")"

echo
echo "-- Coexist with library item --"
LIB_ID=$(db_scalar "INSERT INTO content_library (title, type) VALUES ('__AUDIT_INT_Lib__', 'text') RETURNING id;")
check_not_empty "library item seeded" "$LIB_ID"

http_post "/api/portal/$PORTAL_ID/items" "{\"contentLibraryId\":$LIB_ID}" > /dev/null
RESP=$(http_get "/api/portal/$PORTAL_ID/items")
check "portal has 2 items" "2" "$(echo "$RESP" | jlen_items)"

LIB_COUNT=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(sum(1 for i in d.get("items",[]) if i.get("sourceType")=="library"))')
ITIN_COUNT=$(echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(sum(1 for i in d.get("items",[]) if i.get("sourceType")=="itinerary"))')
check "1 library item" "1" "$LIB_COUNT"
check "1 itinerary item" "1" "$ITIN_COUNT"

echo
echo "-- Soft-delete itinerary while attached --"
http_delete "/api/itineraries/$ITIN_ID" > /dev/null
DELETED=$(db_count "SELECT deleted_at IS NOT NULL FROM itineraries WHERE id=$ITIN_ID;")
check "itinerary soft-deleted" "1" "$DELETED"

RESP=$(http_get "/api/portal/$PORTAL_ID/items")
AFTER_COUNT=$(echo "$RESP" | jlen_items)
check "portal still returns its items after itinerary soft-delete" "2" "$AFTER_COUNT"

# The itinerary item should still be present (soft-deleted data still resolves,
# OR the portal shows an unavailable-item placeholder — both are defensible).
ITIN_STILL=$(db_count "SELECT COUNT(*) FROM portal_items WHERE portal_id=$PORTAL_ID AND source_type='itinerary';")
check "portal_items row for itinerary preserved" "1" "$ITIN_STILL"

echo
echo "-- Full nested read of itinerary post-delete --"
STATUS=$(http_status GET "/api/itineraries/$ITIN_ID")
check "GET soft-deleted itinerary returns 404" "404" "$STATUS"

suite_end
