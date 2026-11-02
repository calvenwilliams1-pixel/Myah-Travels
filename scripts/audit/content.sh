#!/usr/bin/env bash
# Content rendering audit — public pages must render actual body content,
# not raw JSON. Catches the class of bug where a page returns 200 but shows
# raw block JSON instead of rendered content.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

require_server

suite_begin "content"

echo "-- Blog posts --"
BLOG_SLUGS=$(db_query "SELECT slug FROM posts WHERE status = 'published' AND deleted_at IS NULL AND content IS NOT NULL AND content != '' LIMIT 3;")
if [ -z "$BLOG_SLUGS" ]; then
  echo "  (info) no published posts to test"
else
  while IFS= read -r slug; do
    [ -z "$slug" ] && continue
    STATUS=$(http_status GET "/blog/$slug")
    check "blog $slug returns 200" "200" "$STATUS"
    if [ "$STATUS" = "200" ]; then
      BODY=$(curl -s --max-time 15 "$BASE/blog/$slug")
      check "no raw blocks JSON on /blog/$slug" "0" "$(echo "$BODY" | grep -c '"blocks"')"
      check "no 'Content unavailable' on /blog/$slug" "0" "$(echo "$BODY" | grep -c 'Content unavailable')"
    fi
  done <<< "$BLOG_SLUGS"
fi

echo "-- Guides --"
GUIDE_SLUGS=$(db_query "SELECT slug FROM guides WHERE status = 'published' AND deleted_at IS NULL AND content IS NOT NULL AND content != '' LIMIT 2;")
if [ -z "$GUIDE_SLUGS" ]; then
  echo "  (info) no published guides to test"
else
  while IFS= read -r slug; do
    [ -z "$slug" ] && continue
    STATUS=$(http_status GET "/guides/$slug")
    check "guide $slug returns 200" "200" "$STATUS"
    if [ "$STATUS" = "200" ]; then
      BODY=$(curl -s --max-time 15 "$BASE/guides/$slug")
      check "no raw blocks JSON on /guides/$slug" "0" "$(echo "$BODY" | grep -c '"blocks"')"
    fi
  done <<< "$GUIDE_SLUGS"
fi

echo "-- Reviews --"
REVIEW_SLUGS=$(db_query "SELECT slug FROM reviews WHERE status = 'published' AND deleted_at IS NULL AND content IS NOT NULL AND content != '' LIMIT 2;")
if [ -z "$REVIEW_SLUGS" ]; then
  echo "  (info) no published reviews to test"
else
  while IFS= read -r slug; do
    [ -z "$slug" ] && continue
    STATUS=$(http_status GET "/reviews/$slug")
    check "review $slug returns 200" "200" "$STATUS"
    if [ "$STATUS" = "200" ]; then
      BODY=$(curl -s --max-time 15 "$BASE/reviews/$slug")
      check "no raw blocks JSON on /reviews/$slug" "0" "$(echo "$BODY" | grep -c '"blocks"')"
    fi
  done <<< "$REVIEW_SLUGS"
fi

echo "-- Static pages --"
PRIVACY=$(curl -s --max-time 15 "$BASE/privacy")
check "privacy renders 'privacy policy'" "1" "$(echo "$PRIVACY" | grep -c 'privacy policy')"

FAQ=$(curl -s --max-time 15 "$BASE/faq")
FAQ_SIZE=$(echo "$FAQ" | wc -c | tr -d ' ')
check "faq renders (>1000 bytes)" "1" "$([ "$FAQ_SIZE" -gt 1000 ] && echo 1 || echo 0)"

suite_end
