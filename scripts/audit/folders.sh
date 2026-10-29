#!/usr/bin/env bash
set -u
BASE=http://localhost:3000
DB=data/site.db
PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "PASS  $label"
    PASS=$((PASS+1))
  else
    echo "FAIL  $label (expected='$expected' actual='$actual')"
    FAIL=$((FAIL+1))
  fi
}

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/folders")
if [ "$CODE" != "200" ]; then
  echo "FATAL: dev server not reachable at $BASE (got $CODE). Run: npm run dev"
  exit 1
fi

jget() {
  python3 -c 'import sys,json
d=json.load(sys.stdin)
for k in sys.argv[1].split("."): d = d[int(k)] if k.isdigit() else d[k]
print("true" if d is True else "false" if d is False else d)' "$1"
}

sql_null() { local v="$1"; if [ -z "$v" ]; then echo "NULL"; else echo "$v"; fi; }

echo "=== RESET ==="
sqlite3 $DB "UPDATE media SET folder_id = NULL WHERE folder_id IS NOT NULL;"
sqlite3 $DB "DELETE FROM folders;"
check "reset folders=0" "0" "$(sqlite3 $DB "SELECT COUNT(*) FROM folders;")"

echo
echo "=== CREATE ROOT FOLDERS ==="
TRAVEL=$(curl -s -X POST $BASE/api/folders -H "Content-Type: application/json" -d '{"name":"Travel"}' | jget "folder.id")
MARKETING=$(curl -s -X POST $BASE/api/folders -H "Content-Type: application/json" -d '{"name":"Marketing"}' | jget "folder.id")
check "travel created" "true" "$( [ -n "$TRAVEL" ] && echo true || echo false )"
check "marketing created" "true" "$( [ -n "$MARKETING" ] && echo true || echo false )"

echo
echo "=== CREATE NESTED FOLDER ==="
JAPAN=$(curl -s -X POST $BASE/api/folders -H "Content-Type: application/json" -d "{\"name\":\"Japan\",\"parentId\":$TRAVEL}" | jget "folder.id")
check "japan created" "true" "$( [ -n "$JAPAN" ] && echo true || echo false )"

TREE=$(curl -s $BASE/api/folders)
check "tree has 2 roots" "2" "$(echo "$TREE" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)["tree"]))')"
check "travel has 1 child" "1" "$(echo "$TREE" | TRAVEL_ID="$TRAVEL" python3 -c 'import sys,json,os; t=json.load(sys.stdin)["tree"]; n=int(os.environ["TRAVEL_ID"]); print(len([x for x in t if x["id"]==n][0]["children"]))')"

echo
echo "=== MOVE FILE INTO NESTED FOLDER ==="
MOVE=$(curl -s -X POST $BASE/api/media/1/move -H "Content-Type: application/json" -d "{\"folderId\":$JAPAN}")
check "move success" "true" "$(echo "$MOVE" | jget "success")"
check "media 1 folder_id" "$JAPAN" "$(sqlite3 $DB "SELECT folder_id FROM media WHERE id=1;")"

TREE=$(curl -s $BASE/api/folders)
check "japan fileCount=1" "1" "$(echo "$TREE" | TRAVEL_ID="$TRAVEL" python3 -c 'import sys,json,os; t=json.load(sys.stdin)["tree"]; n=int(os.environ["TRAVEL_ID"]); print([x for x in t if x["id"]==n][0]["children"][0]["fileCount"])')"

echo
echo "=== RENAME FOLDER ==="
curl -s -X PATCH $BASE/api/folders/$TRAVEL -H "Content-Type: application/json" -d '{"name":"Asia"}' > /dev/null
TREE=$(curl -s $BASE/api/folders)
check "renamed to Asia" "Asia" "$(echo "$TREE" | TRAVEL_ID="$TRAVEL" python3 -c 'import sys,json,os; t=json.load(sys.stdin)["tree"]; n=int(os.environ["TRAVEL_ID"]); print([x for x in t if x["id"]==n][0]["name"])')"

echo
echo "=== DELETE PARENT CASCADE ==="
DEL=$(curl -s -X DELETE $BASE/api/folders/$TRAVEL)
check "delete success" "true" "$(echo "$DEL" | jget "success")"
check "media 1 folder_id=NULL" "NULL" "$(sql_null "$(sqlite3 $DB "SELECT folder_id FROM media WHERE id=1;")")"
check "japan soft-deleted" "1" "$(sqlite3 $DB "SELECT deleted_at IS NOT NULL FROM folders WHERE id=$JAPAN;")"
check "asia soft-deleted" "1" "$(sqlite3 $DB "SELECT deleted_at IS NOT NULL FROM folders WHERE id=$TRAVEL;")"

echo
echo "=== CLEANUP MARKETING ==="
curl -s -X DELETE $BASE/api/folders/$MARKETING > /dev/null
TREE=$(curl -s $BASE/api/folders)
check "tree empty" "0" "$(echo "$TREE" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)["tree"]))')"

echo
echo "=== DESCENDANT MOVE PREVENTION ==="
A=$(curl -s -X POST $BASE/api/folders -H "Content-Type: application/json" -d '{"name":"A"}' | jget "folder.id")
B=$(curl -s -X POST $BASE/api/folders -H "Content-Type: application/json" -d "{\"name\":\"B\",\"parentId\":$A}" | jget "folder.id")
check "move A under B rejected" "400" "$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE/api/folders/$A -H "Content-Type: application/json" -d "{\"parentId\":$B}")"
check "move A under self rejected" "400" "$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE/api/folders/$A -H "Content-Type: application/json" -d "{\"parentId\":$A}")"

echo
echo "=== INVALID INPUTS ==="
check "empty name rejected" "400" "$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/folders -H "Content-Type: application/json" -d '{"name":""}')"
check "invalid parentId rejected" "404" "$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/folders -H "Content-Type: application/json" -d '{"name":"X","parentId":99999}')"
check "move to invalid folder rejected" "400" "$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE/api/media/1/move -H "Content-Type: application/json" -d '{"folderId":99999}')"
check "invalid JSON rejected" "400" "$(curl -s -o /dev/null -w "%{http_code}" -X PATCH $BASE/api/folders/$A -H "Content-Type: application/json" -d 'not-json')"

echo
echo "=== FINAL CLEANUP ==="
sqlite3 $DB "UPDATE media SET folder_id = NULL WHERE folder_id IS NOT NULL;"
sqlite3 $DB "DELETE FROM folders;"
check "final cleanup" "0" "$(sqlite3 $DB "SELECT COUNT(*) FROM folders;")"

echo
echo "================================"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo "================================"
exit $([ $FAIL -eq 0 ] && echo 0 || echo 1)
