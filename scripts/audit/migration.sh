#!/usr/bin/env bash
# Migration completeness audit.
# Creates a fresh DB via setup-db.js, compares schema (tables, columns,
# indexes, FKs) against the dev DB. Fails if any structural element is
# missing from fresh install — meaning a migration is missing or
# setup-db.js doesn't apply it.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/../..")"

suite_begin "migration"

FRESH_DB="/tmp/audit-fresh-migration.db"
rm -f "$FRESH_DB"

echo "-- Fresh install via setup-db.js --"
if ! DATABASE_URL="$FRESH_DB" node scripts/setup-db.js > /tmp/audit-migration-setup.log 2>&1; then
  echo "    setup-db.js failed:"
  tail -20 /tmp/audit-migration-setup.log | sed 's/^/      /'
  check "setup-db.js exits cleanly" "0" "1"
  rm -f "$FRESH_DB"
  suite_end
fi
check "setup-db.js exits cleanly" "0" "0"

if [ ! -f "$FRESH_DB" ]; then
  echo "    fresh DB not created at $FRESH_DB"
  check "fresh DB exists" "1" "0"
  suite_end
fi

echo
echo "-- Tables --"
DEV_TABLES=$(sqlite3 data/site.db "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
FRESH_TABLES=$(sqlite3 "$FRESH_DB" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
MISSING_TABLES=$(comm -23 <(echo "$DEV_TABLES") <(echo "$FRESH_TABLES"))
if [ -n "$MISSING_TABLES" ]; then
  echo "    Missing from fresh install:"
  echo "$MISSING_TABLES" | sed 's/^/      - /'
fi
check "no missing tables" "0" "$(echo -n "$MISSING_TABLES" | grep -c .)"

echo
echo "-- Columns --"
COL_DIFFS=0
while IFS= read -r table; do
  [ -z "$table" ] && continue
  DEV_COLS=$(sqlite3 data/site.db "PRAGMA table_info($table);" | cut -d'|' -f2 | sort)
  FRESH_COLS=$(sqlite3 "$FRESH_DB" "PRAGMA table_info($table);" | cut -d'|' -f2 | sort)
  MISSING_COLS=$(comm -23 <(echo "$DEV_COLS") <(echo "$FRESH_COLS"))
  if [ -n "$MISSING_COLS" ]; then
    echo "    $table missing columns:"
    echo "$MISSING_COLS" | sed 's/^/      - /'
    COL_DIFFS=$((COL_DIFFS + 1))
  fi
done <<< "$DEV_TABLES"
check "no missing columns" "0" "$COL_DIFFS"

echo
echo "-- Indexes --"
DEV_IDX=$(sqlite3 data/site.db "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
FRESH_IDX=$(sqlite3 "$FRESH_DB" "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name;")
MISSING_IDX=$(comm -23 <(echo "$DEV_IDX") <(echo "$FRESH_IDX"))
if [ -n "$MISSING_IDX" ]; then
  echo "    Missing from fresh install:"
  echo "$MISSING_IDX" | sed 's/^/      - /'
fi
check "no missing indexes" "0" "$(echo -n "$MISSING_IDX" | grep -c .)"

echo
echo "-- Foreign keys --"
FK_DIFFS=0
while IFS= read -r table; do
  [ -z "$table" ] && continue
  DEV_FK=$(sqlite3 data/site.db "PRAGMA foreign_key_list($table);" 2>/dev/null | sort)
  FRESH_FK=$(sqlite3 "$FRESH_DB" "PRAGMA foreign_key_list($table);" 2>/dev/null | sort)
  if [ "$DEV_FK" != "$FRESH_FK" ]; then
    echo "    $table FK mismatch"
    FK_DIFFS=$((FK_DIFFS + 1))
  fi
done <<< "$DEV_TABLES"
check "no FK mismatches" "0" "$FK_DIFFS"

rm -f "$FRESH_DB"

suite_end
