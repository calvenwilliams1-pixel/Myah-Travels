#!/usr/bin/env bash
# Auth rate-limit audit. Verifies login rate limiting works end-to-end.
#
# This suite owns IPv6 documentation range subnets:
#   2001:db8:a::/48  (primary test IP, time-encoded)
#   2001:db8:b::/48  (isolation test IP, time-encoded)
#   2001:db8:c::/48  (distributed-guessing test IPs, time-encoded)
# No other suite may send CF-Connecting-IP in these ranges.
# If you add a suite that posts to /api/auth/login, set a unique
# CF-Connecting-IP — otherwise all such calls share the "unknown" bucket
# and collide with each other inside the 5-per-15-min window.
#
# No DISABLE_AUTH override needed — the rate limiter fires before any
# auth bypass is consulted. Verified against app/api/auth/login/route.ts.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

require_server
suite_begin "auth-rate-limit"

T=$(date +%s)
HEX=$(printf '%x' "$T")
ipA="2001:db8:a::${HEX}"
ipB="2001:db8:b::${HEX}"

hit() {
  curl -s -o /tmp/auth-rl-body -w '%{http_code}' \
    -X POST "$BASE/api/auth/login" \
    -H 'Content-Type: application/json' \
    -H "CF-Connecting-IP: $1" \
    -d '{"username":"nonexistent-audit-user","password":"wrong"}'
}

echo "-- attempts 1-5 from $ipA (expect 401) --"
for i in 1 2 3 4 5; do
  code=$(hit "$ipA")
  if [ "$i" = "1" ] && [ "$code" = "429" ]; then
    echo "  attempt $i: 429 (bucket already dirty — this run collided with a prior run's IP)"
    echo "  FAIL: cannot run — dirty bucket, rerun after 15 min or use a different clock"
    suite_end
    exit 1
  fi
  check "attempt $i returns 401" "401" "$code"
done

echo "-- attempt 6 from $ipA (expect 429) --"
code=$(hit "$ipA")
check "attempt 6 returns 429" "429" "$code"

BODY=$(cat /tmp/auth-rl-body)
if echo "$BODY" | grep -q "Too many"; then
  echo "  PASS: body mentions 'Too many'"
else
  echo "  FAIL: body did not mention rate limit (got: $BODY)"
fi

echo "-- attempt 7 from $ipA (expect 429, still blocked) --"
code=$(hit "$ipA")
check "attempt 7 still 429" "429" "$code"

echo "-- attempt 1 from $ipB (expect 401, not rate-limited) --"
code=$(hit "$ipB")
check "different IP unaffected" "401" "$code"

echo "-- distributed guessing: 10 fresh IPs against one username (expect 401 x10, then 429) --"
distUser="audit-dist-${HEX}"
for i in $(seq 1 10); do
  code=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "$BASE/api/auth/login" \
    -H 'Content-Type: application/json' \
    -H "CF-Connecting-IP: 2001:db8:c::${HEX}${i}" \
    -d "{\"username\":\"${distUser}\",\"password\":\"wrong\"}")
  check "distributed attempt $i returns 401" "401" "$code"
done
code=$(curl -s -o /dev/null -w '%{http_code}' \
  -X POST "$BASE/api/auth/login" \
  -H 'Content-Type: application/json' \
  -H "CF-Connecting-IP: 2001:db8:c::${HEX}11" \
  -d "{\"username\":\"${distUser}\",\"password\":\"wrong\"}")
check "distributed attempt 11 returns 429 (per-username limit)" "429" "$code"

echo
echo "FIXED (Nov 23, 2026): successful login resets both login counters"
echo "FIXED (Nov 23, 2026): per-username limiter (10 per 15 min across all"
echo "  IPs) defends distributed guessing on one account"
echo
echo "Note: reset-on-success is covered by unit tests"
echo "(lib/security/rate-limit.test.ts) — this suite uses a nonexistent"
echo "user, so it cannot exercise a successful login. The shared audit"
echo "username also carries a 10-per-15-min cross-IP bucket: rerunning"
echo "the whole suite inside 15 minutes can collide with it, the same"
echo "caveat as the per-IP buckets above."

suite_end
