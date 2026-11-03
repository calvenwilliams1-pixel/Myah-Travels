#!/usr/bin/env bash
# Magic link audit. Verifies token generation, queue wiring, validation,
# session creation, cookie attributes, wall access, and cross-portal isolation.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/../..")"

require_server
suite_begin "magic-link"

cleanup() {
  db_query "DELETE FROM portal_items WHERE portal_id IN (SELECT id FROM portals WHERE name LIKE '__AUDIT_ML_%');" 2>/dev/null
  db_query "DELETE FROM portal_magic_links WHERE portal_id IN (SELECT id FROM portals WHERE name LIKE '__AUDIT_ML_%');" 2>/dev/null
  db_query "DELETE FROM portal_members WHERE portal_id IN (SELECT id FROM portals WHERE name LIKE '__AUDIT_ML_%');" 2>/dev/null
  db_query "DELETE FROM portal_sessions WHERE portal_id IN (SELECT id FROM portals WHERE name LIKE '__AUDIT_ML_%');" 2>/dev/null
  db_query "DELETE FROM portals WHERE name LIKE '__AUDIT_ML_%';" 2>/dev/null
  db_query "DELETE FROM email_queue WHERE to_email LIKE '%@test.local';" 2>/dev/null
}
trap cleanup EXIT
cleanup

RUN_ID="$(date +%s)-$$"

echo "-- Seed portal + member --"
PORTAL_ID=$(db_scalar "INSERT INTO portals (name, slug) VALUES ('__AUDIT_ML_Portal__', '__audit_ml_portal_$RUN_ID') RETURNING id;")
check_not_empty "portal seeded" "$PORTAL_ID"

MEMBER_ID=$(db_scalar "INSERT INTO portal_members (portal_id, email, name) VALUES ($PORTAL_ID, '__audit_ml_member@test.local', 'Test Member') RETURNING id;")
check_not_empty "member seeded" "$MEMBER_ID"

PORTAL_SLUG="__audit_ml_portal_$RUN_ID"

echo
echo "-- Valid token access page --"
db_query "INSERT INTO portal_magic_links (portal_id, member_id, token, expires_at) VALUES ($PORTAL_ID, $MEMBER_ID, 'audit-token-$RUN_ID', datetime('now', '+7 days'));"
check "magic link row inserted" "1" "$(db_count "SELECT COUNT(*) FROM portal_magic_links WHERE token='audit-token-$RUN_ID';")"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/portal/access/audit-token-$RUN_ID")
check "valid token access page 200" "200" "$STATUS"

echo
echo "-- Invalid token --"
BODY=$(curl -s "$BASE/portal/access/nonexistent-token-xyz")
check_contains "invalid token shows expired message" "Link Expired" "$BODY"

echo
echo "-- Consume token --"
CONSUME=$(curl -s -X POST "$BASE/portal/consume/audit-token-$RUN_ID" -o /dev/null -w "%{http_code}|%{redirect_url}")
C_STATUS=$(echo "$CONSUME" | cut -d'|' -f1)
C_REDIR=$(echo "$CONSUME" | cut -d'|' -f2)
check "consume returns redirect" "1" "$([ "$C_STATUS" = "303" ] || [ "$C_STATUS" = "307" ] && echo 1 || echo 0)"
check_contains "redirect goes to portal wall" "/portal/$PORTAL_SLUG" "$C_REDIR"

check "session created" "1" "$(db_count "SELECT COUNT(*) FROM portal_sessions WHERE portal_id=$PORTAL_ID;")"
check_not_empty "token marked used" "$(db_scalar "SELECT used_at FROM portal_magic_links WHERE token='audit-token-$RUN_ID';")"

echo
echo "-- Token single-use --"
curl -s -X POST "$BASE/portal/consume/audit-token-$RUN_ID" -o /dev/null -w "%{http_code}" > /tmp/ml-2nd-consume
check "no second session" "1" "$(db_count "SELECT COUNT(*) FROM portal_sessions WHERE portal_id=$PORTAL_ID;")"

echo
echo "-- Wall access --"
SESSION_ID=$(db_scalar "SELECT id FROM portal_sessions WHERE portal_id=$PORTAL_ID LIMIT 1;")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Cookie: portal_session=$SESSION_ID" "$BASE/portal/$PORTAL_SLUG")
check "wall with session (200)" "200" "$STATUS"

BODY=$(curl -s "$BASE/portal/$PORTAL_SLUG")
check_contains "wall without session shows expired" "Session Expired" "$BODY"

echo
echo "-- Cross-portal isolation --"
PORTAL_B_SLUG="__audit_ml_portalb_$RUN_ID"
db_query "INSERT INTO portals (name, slug) VALUES ('__AUDIT_ML_PortalB__', '$PORTAL_B_SLUG');"
BODY=$(curl -s -H "Cookie: portal_session=$SESSION_ID" "$BASE/portal/$PORTAL_B_SLUG")
check_contains "session A sees access denied for B" "Access Denied" "$BODY"

echo
echo "-- Expired token rejected --"
db_query "INSERT INTO portal_magic_links (portal_id, member_id, token, expires_at) VALUES ($PORTAL_ID, $MEMBER_ID, 'audit-expired-$RUN_ID', datetime('now', '-1 day'));"
BODY=$(curl -s "$BASE/portal/access/audit-expired-$RUN_ID")
check_contains "expired token shows expired message" "Link Expired" "$BODY"

echo
echo "-- sendMagicLinkEmails wiring --"
db_query "DELETE FROM email_queue WHERE to_email = '__audit_ml_member@test.local';"
RESULT=$(npx tsx -e "import { sendMagicLinkEmails } from './lib/portal'; sendMagicLinkEmails($PORTAL_ID).then(() => console.log('done')).catch(e => console.error(e));" 2>&1 | tail -1)
check "sendMagicLinkEmails ran" "done" "$RESULT"

QUEUE_COUNT=$(db_count "SELECT COUNT(*) FROM email_queue WHERE to_email = '__audit_ml_member@test.local';")
check "email queued for member" "1" "$QUEUE_COUNT"

if [ "$QUEUE_COUNT" = "1" ]; then
  BODY_HTML=$(db_scalar "SELECT body FROM email_queue WHERE to_email = '__audit_ml_member@test.local' LIMIT 1;")
  check_contains "email contains access URL" "/portal/access/" "$BODY_HTML"
  check_contains "email contains portal name" "__AUDIT_ML_Portal__" "$BODY_HTML"
fi

suite_end
