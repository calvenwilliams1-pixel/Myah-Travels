#!/usr/bin/env bash
# Auth rate-limit audit. Verifies login rate limiting works end-to-end.
#
# This suite owns IPv6 documentation range subnets:
#   2001:db8:a::/48  (primary test IP, time-encoded)
#   2001:db8:b::/48  (isolation test IP, time-encoded)
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

echo
echo "FINDING: successful login does not reset the per-IP counter"
echo "FINDING: no per-username limiter (distributed guessing on one account is undefended)"
echo "FINDING: per-IP-only limiter has no defense against distributed guessing"
echo
echo "These are policy observations, not test failures. See DATA-DURABILITY.md for hardening TODO."

suite_end
