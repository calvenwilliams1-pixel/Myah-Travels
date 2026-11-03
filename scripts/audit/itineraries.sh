#!/usr/bin/env bash
# Itinerary API audit. Seeds via SQL (no POST /api/itineraries exists),
# then exercises every downstream route.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

require_server
suite_begin "itineraries"

cleanup() {
  db_query "DELETE FROM itinerary_segments WHERE day_id IN (SELECT id FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE title LIKE '__AUDIT_%')));" 2>/dev/null
  db_query "DELETE FROM itinerary_days WHERE section_id IN (SELECT id FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE title LIKE '__AUDIT_%'));" 2>/dev/null
  db_query "DELETE FROM itinerary_sections WHERE itinerary_id IN (SELECT id FROM itineraries WHERE title LIKE '__AUDIT_%');" 2>/dev/null
  db_query "DELETE FROM itineraries WHERE title LIKE '__AUDIT_%';" 2>/dev/null
}
trap cleanup EXIT
cleanup

echo "-- Seed portal + itinerary --"
PORTAL_ID=$(db_scalar "INSERT INTO portals (name, slug) VALUES ('__AUDIT_ITIN_PORTAL__', '__audit_itinerary_portal__') RETURNING id;")
check_not_empty "portal seeded" "$PORTAL_ID"

ITIN_ID=$(db_scalar "INSERT INTO itineraries (portal_id, title, created_at) VALUES ($PORTAL_ID, '__AUDIT_Itinerary__', CURRENT_TIMESTAMP) RETURNING id;")
check_not_empty "itinerary seeded" "$ITIN_ID"

echo
echo "-- Section CRUD --"
RESP=$(http_post "/api/itineraries/$ITIN_ID/sections" '{"title":"__AUDIT_Section__","baseCity":"Tokyo","startDate":"2026-06-01","endDate":"2026-06-05"}')
SEC_ID=$(echo "$RESP" | jget "section.id")
check_not_empty "POST section returns id" "$SEC_ID"
check "section in DB" "1" "$(db_count "SELECT COUNT(*) FROM itinerary_sections WHERE id=$SEC_ID;")"

RESP=$(http_get "/api/itineraries/$ITIN_ID/sections")
check "GET sections returns 1" "1" "$(echo "$RESP" | jlen)"

echo
echo "-- Day CRUD --"
RESP=$(http_post "/api/sections/$SEC_ID/days" '{"date":"2026-06-01","dayNumber":1,"title":"__AUDIT_Day1__"}')
DAY_ID=$(echo "$RESP" | jget "day.id")
check_not_empty "POST day returns id" "$DAY_ID"

RESP=$(http_get "/api/sections/$SEC_ID/days")
check "GET days returns 1" "1" "$(echo "$RESP" | jlen)"

echo
echo "-- Segment CRUD --"
RESP=$(http_post "/api/days/$DAY_ID/segments" '{"type":"activity","title":"__AUDIT_Segment__","location":"Shibuya"}')
SEG_ID=$(echo "$RESP" | jget "segment.id")
check_not_empty "POST segment returns id" "$SEG_ID"

RESP=$(http_get "/api/days/$DAY_ID/segments")
check "GET segments returns 1" "1" "$(echo "$RESP" | jlen)"

echo
echo "-- Full itinerary GET --"
RESP=$(http_get "/api/itineraries/$ITIN_ID")
check "full itinerary returns title" "__AUDIT_Itinerary__" "$(echo "$RESP" | jget "itinerary.title")"

echo
echo "-- Update --"
RESP=$(http_patch "/api/itineraries/$ITIN_ID" '{"title":"__AUDIT_Updated__"}')
check "PATCH title returns success" "true" "$(echo "$RESP" | jget "success")"
check "title updated in DB" "__AUDIT_Updated__" "$(db_scalar "SELECT title FROM itineraries WHERE id=$ITIN_ID;")"

echo
echo "-- Validation --"
STATUS=$(http_status POST "/api/itineraries/$ITIN_ID/sections" '{"title":""}')
check "empty section title rejected (400)" "400" "$STATUS"

STATUS=$(http_status POST "/api/sections/$SEC_ID/days" '{"dayNumber":2}')
check "day missing date rejected (400)" "400" "$STATUS"

STATUS=$(http_status POST "/api/days/$DAY_ID/segments" '{"type":"invalid","title":"x"}')
check "invalid segment type rejected (400)" "400" "$STATUS"

echo
echo "-- Delete (soft) --"
RESP=$(http_delete "/api/itineraries/$ITIN_ID")
check "DELETE returns success" "true" "$(echo "$RESP" | jget "success")"
check "deleted_at set" "1" "$(db_count "SELECT deleted_at IS NOT NULL FROM itineraries WHERE id=$ITIN_ID;")"

suite_end
