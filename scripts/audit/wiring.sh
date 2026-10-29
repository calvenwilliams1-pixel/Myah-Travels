#!/usr/bin/env bash
# Wiring test: every API RESOURCE should have at least one UI caller.
# Groups routes by base resource (e.g. api/folders, api/portals) and
# verifies the base appears in at least one UI file's fetch call.
#
# Some resources are legitimately not called from the UI:
#   - webhooks (external services)
#   - cron endpoints (scheduler)
#   - health checks (monitoring)
#   - auth routes (form actions / middleware)
# These are allowlisted below.
#
# What this catches: a resource endpoint exists but no UI references it at all.
# What this does NOT catch: endpoint referenced but wrong method/params
# (that's the API tests' job), or specific sub-operations missing UI
# (e.g. folders has create+delete UI but not rename).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$SCRIPT_DIR/../..")"

suite_begin "wiring"

SEARCH_DIRS="components app/admin app/preview"

# Base resources exempt from "must have a UI caller" check.
ALLOWLIST=(
  "api/email/webhook"
  "api/email/process-queue"
  "api/email/status"
  "api/health"
  "api/auth/login"
  "api/feed"
  "api/search"
  "api/tags/suggest"
  "api/canvas/templates"
  "api/suggestions/telemetry"
  "api/suggestions/statics"
  "api/suggestions/field-values"
  "api/suggestions/entities"
  "api/suggestions/snippets"
  "api/itinerary-blocks"
)

is_allowlisted() {
  local resource="$1"
  for a in "${ALLOWLIST[@]}"; do
    [ "$resource" = "$a" ] && return 0
  done
  return 1
}

# Derive base resource from route file path.
# app/api/folders/route.ts             -> api/folders
# app/api/folders/[id]/route.ts        -> api/folders
# app/api/media/[id]/move/route.ts     -> api/media
# app/api/portal/[id]/items/route.ts   -> api/portal
route_to_resource() {
  local file="$1"
  local stripped="${file#app/}"
  stripped="${stripped%/route.ts}"
  # Take everything up to the first dynamic segment
  local resource="${stripped%%/\[*}"
  echo "$resource"
}

# Count UI files that reference this resource (as a fetch URL or string)
count_callers() {
  local resource="$1"
  grep -rl --include="*.tsx" --include="*.ts" "\"$resource\|'$resource\|/$resource" $SEARCH_DIRS 2>/dev/null | wc -l | tr -d ' '
}

# Collect unique base resources
declare -A seen
RESOURCES=()
while IFS= read -r file; do
  r=$(route_to_resource "$file")
  [ -z "$r" ] && continue
  if [ -z "${seen[$r]:-}" ]; then
    seen[$r]=1
    RESOURCES+=("$r")
  fi
done < <(find app/api -name "route.ts" -type f 2>/dev/null | sort)

# Sort resources for stable output
IFS=$'\n' RESOURCES=($(sort <<<"${RESOURCES[*]}")); unset IFS

# Test each resource
for resource in "${RESOURCES[@]}"; do
  if is_allowlisted "$resource"; then
    PASS=$((PASS+1))
    printf "  PASS  %s (allowlisted)\n" "$resource"
    continue
  fi

  count=$(count_callers "$resource")
  if [ "$count" -gt 0 ]; then
    PASS=$((PASS+1))
    printf "  PASS  %s (%d UI file(s))\n" "$resource" "$count"
  else
    FAIL=$((FAIL+1))
    FAIL_DETAILS+=("$resource — no UI caller")
    printf "  FAIL  %s — no UI caller\n" "$resource"
  fi
done

suite_end
