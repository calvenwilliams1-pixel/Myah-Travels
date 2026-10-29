#!/usr/bin/env bash
# Shared helpers for audit test scripts.
# Source this at the top of every audit script:
#   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#   source "$SCRIPT_DIR/lib.sh"

set -u

BASE="${BASE:-http://localhost:3000}"
DB="${DB:-data/site.db}"

PASS=0
FAIL=0
FAIL_DETAILS=()

# --- Assertions ---

check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    PASS=$((PASS+1))
    printf "  PASS  %s\n" "$label"
  else
    FAIL=$((FAIL+1))
    FAIL_DETAILS+=("$label (expected='$expected' actual='$actual')")
    printf "  FAIL  %s (expected='%s' actual='%s')\n" "$label" "$expected" "$actual"
  fi
}

check_contains() {
  local label="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -qF -- "$needle"; then
    PASS=$((PASS+1))
    printf "  PASS  %s\n" "$label"
  else
    FAIL=$((FAIL+1))
    FAIL_DETAILS+=("$label (missing '$needle')")
    printf "  FAIL  %s (missing '%s')\n" "$label" "$needle"
  fi
}

check_not_empty() {
  local label="$1" value="$2"
  if [ -n "$value" ]; then
    PASS=$((PASS+1))
    printf "  PASS  %s\n" "$label"
  else
    FAIL=$((FAIL+1))
    FAIL_DETAILS+=("$label (empty)")
    printf "  FAIL  %s (empty)\n" "$label"
  fi
}

# --- HTTP ---

http_get()    { curl -s "$BASE$1"; }
http_post()   { curl -s -X POST "$BASE$1" -H "Content-Type: application/json" -d "$2"; }
http_patch()  { curl -s -X PATCH "$BASE$1" -H "Content-Type: application/json" -d "$2"; }
http_delete() { curl -s -X DELETE "$BASE$1"; }

http_status() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path" -H "Content-Type: application/json" -d "$body"
  else
    curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path"
  fi
}

# --- JSON helpers ---

# jget 'path.to.field' < json
jget() {
  python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    print("__JSON_ERR__")
    sys.exit(0)
for k in sys.argv[1].split("."):
    if isinstance(d, list):
        d = d[int(k)]
    else:
        d = d.get(k) if isinstance(d, dict) else None
    if d is None:
        print("__MISSING__")
        sys.exit(0)
print("true" if d is True else "false" if d is False else d)
' "$1"
}

jlen() {
  python3 -c 'import sys,json
try: d=json.load(sys.stdin)
except: print(0); sys.exit(0)
print(len(d) if isinstance(d,(list,dict)) else 0)'
}

# --- DB helpers ---

db_query() {
  sqlite3 "$DB" "$1" 2>/dev/null
}

db_count() {
  sqlite3 "$DB" "$1" 2>/dev/null || echo 0
}

# null is empty string in sqlite3 cli output — normalize to literal "NULL"
db_nullable() {
  local v="$1"
  if [ -z "$v" ]; then echo "NULL"; else echo "$v"; fi
}

# --- Server sanity ---

require_server() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/folders" 2>/dev/null || echo "000")
  if [ "$code" != "200" ]; then
    echo "FATAL: dev server not reachable at $BASE (status: $code)."
    echo "Start it with: npm run dev"
    exit 1
  fi
}

# --- Reporting ---

suite_begin() {
  local name="$1"
  echo
  echo "=== $name ==="
}

suite_end() {
  echo
  echo "--------------------------------"
  echo "  PASS: $PASS"
  echo "  FAIL: $FAIL"
  if [ "$FAIL" -gt 0 ]; then
    echo "  Failures:"
    for d in "${FAIL_DETAILS[@]}"; do
      echo "    - $d"
    done
    exit 1
  fi
  exit 0
}

# --- Cleanup safety ---

# Reset all folders and folder assignments (for folder/media tests)
reset_folders() {
  db_query "UPDATE media SET folder_id = NULL WHERE folder_id IS NOT NULL;" || true
  db_query "DELETE FROM folders;" || true
}

# Delete only test posts tagged with [AUDIT] in title
reset_audit_posts() {
  db_query "DELETE FROM posts WHERE title LIKE '[AUDIT]%';" || true
}

# Delete only test portals tagged with [AUDIT]
reset_audit_portals() {
  db_query "DELETE FROM portals WHERE title LIKE '[AUDIT]%';" || true
}

# Returns length of `items` array in JSON
jlen_items() {
  python3 -c 'import sys,json
try: d=json.load(sys.stdin)
except: print(0); sys.exit(0)
print(len(d.get("items", [])))'
}

# Returns id of first item in `items` array
jfirst_id() {
  python3 -c 'import sys,json
try: d=json.load(sys.stdin)
except: print(""); sys.exit(0)
items = d.get("items", [])
print(items[0]["id"] if items else "")'
}
