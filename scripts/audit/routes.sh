#!/usr/bin/env bash
# Route existence + basic render test.
# For each static page URL, verify it returns 200 and does not crash.
# Marker strings (tier B) verify the correct component rendered.
# Redirect stubs (guides/new, reviews/new) expect 307 -> /admin/posts/new.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

require_server

suite_begin "routes"

# check_page <path> <label> [marker]
check_page() {
  local path="$1" label="$2" marker="${3:-}"
  local timeout="${HTTP_TIMEOUT:-15}"
  local status=$(curl -s --max-time "$timeout" -o /dev/null -w "%{http_code}" "$BASE$path")
  check "status 200: $path" "200" "$status"

  if [ "$status" = "200" ] && [ -n "$marker" ]; then
    local body=$(curl -s --max-time "$timeout" "$BASE$path")
    check_contains "marker '$marker': $path" "$marker" "$body"
  fi
}

# check_redirect <path> <expected_location_substring>
check_redirect() {
  local path="$1" expected_location="$2"
  local timeout="${HTTP_TIMEOUT:-15}"
  local result=$(curl -s --max-time "$timeout" -o /dev/null -w "%{http_code}|%{redirect_url}" "$BASE$path")
  local status="${result%%|*}"
  local location="${result##*|}"
  check "status 307: $path" "307" "$status"
  case "$location" in
    *"$expected_location"*)
      check "redirects to $expected_location: $path" "true" "true"
      ;;
    *)
      check "redirects to $expected_location: $path" "true" "false"
      ;;
  esac
}

echo
echo "-- Public pages --"
check_page "/" "home"
check_page "/about" "about" "About"
check_page "/blog" "blog" "Blog"
check_page "/faq" "faq" "FAQ"
check_page "/guides" "guides" "Guides"
check_page "/privacy" "privacy" "Privacy"
check_page "/reviews" "reviews" "Reviews"
check_page "/videos" "videos" "Videos"

echo
echo "-- Admin: dashboard --"
check_page "/admin" "admin dashboard"

echo
echo "-- Admin: content --"
check_page "/admin/posts" "posts list" "Posts"
check_page "/admin/posts/new" "posts new" "Post"
check_page "/admin/guides" "guides list" "Guides"
check_redirect "/admin/guides/new" "/admin/posts/new"
check_page "/admin/reviews" "reviews list" "Reviews"
check_redirect "/admin/reviews/new" "/admin/posts/new"
check_page "/admin/templates" "templates" "Template"
check_page "/admin/content-library" "content library" "Library"

echo
echo "-- Admin: media + clients --"
check_page "/admin/media" "media library" "Media Library"
check_page "/admin/clients" "clients" "Client"

echo
echo "-- Admin: portals + itineraries --"
check_page "/admin/portals" "portals list" "Portal"
check_page "/admin/portals/new" "portals new"
check_page "/admin/itineraries" "itineraries" "Itinerar"

echo
echo "-- Admin: settings --"
check_page "/admin/settings" "settings" "Settings"
check_page "/admin/settings/password" "settings password" "Password"
check_page "/admin/settings/tags" "settings tags" "Tags"

echo
echo "-- Admin: miscellaneous --"
check_page "/admin/suggestions/stale-entities" "stale entities"
check_page "/admin/homepage" "homepage editor"

echo
echo "-- Auth pages --"
check_page "/admin/login" "login page"
check_page "/admin/enroll-2fa" "enroll 2fa page"

suite_end
