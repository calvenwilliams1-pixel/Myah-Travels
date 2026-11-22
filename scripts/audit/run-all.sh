#!/usr/bin/env bash
# Runs every audit script in scripts/audit/*.sh (excluding lib.sh and run-all.sh).
# Prints a final aggregate summary and exits nonzero if any suite failed.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/../.."

# Preflight: these suites make UNAUTHENTICATED API calls and only work
# against a dev server started with DISABLE_AUTH=true. Against a normally
# secured server every suite fails at once, which looks like catastrophic
# product breakage when it is really a harness configuration problem.
# Probe one gated endpoint: bypass mode answers 200, a secured server
# answers 401/403/500. Abort with an explanation instead of ~36 fake failures.
BASE="${BASE:-http://localhost:3000}"
probe_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/folders" 2>/dev/null || echo "000")
if [ "$probe_code" = "000" ]; then
  echo "FATAL: no server reachable at $BASE. Start the dev server first (with DISABLE_AUTH=true — see below)."
  exit 1
fi
if [ "$probe_code" != "200" ]; then
  echo "FATAL: the server at $BASE is NOT in auth-bypass mode (GET /api/folders -> $probe_code)."
  echo "The audit suites send no credentials and require a dev server started with DISABLE_AUTH=true, e.g.:"
  echo "  DISABLE_AUTH=true npm run dev"
  echo "Aborting so the failures below are not mistaken for product bugs."
  exit 1
fi

TOTAL_PASS=0
TOTAL_FAIL=0
FAILED_SUITES=()
SUITE_SUMMARY=()

# Discover test scripts
SCRIPTS=()
for f in "$SCRIPT_DIR"/*.sh; do
  base=$(basename "$f")
  [ "$base" = "lib.sh" ] && continue
  [ "$base" = "run-all.sh" ] && continue
  SCRIPTS+=("$f")
done

# Sort alphabetically for deterministic order
IFS=$'\n' SCRIPTS=($(sort <<<"${SCRIPTS[*]}")); unset IFS

for script in "${SCRIPTS[@]}"; do
  base=$(basename "$script" .sh)
  echo
  echo "################################################"
  echo "# SUITE: $base"
  echo "################################################"
  
  # Capture output, preserve exit code
  OUTPUT=$(bash "$script" 2>&1)
  EXIT_CODE=$?
  
  echo "$OUTPUT"
  
  # Extract PASS/FAIL from this suite's output
  SUITE_PASS=$(echo "$OUTPUT" | grep -oP '  PASS: \K\d+' | tail -1)
  SUITE_FAIL=$(echo "$OUTPUT" | grep -oP '  FAIL: \K\d+' | tail -1)
  SUITE_PASS=${SUITE_PASS:-0}
  SUITE_FAIL=${SUITE_FAIL:-0}
  
  TOTAL_PASS=$((TOTAL_PASS + SUITE_PASS))
  TOTAL_FAIL=$((TOTAL_FAIL + SUITE_FAIL))
  SUITE_SUMMARY+=("$base: $SUITE_PASS PASS, $SUITE_FAIL FAIL")
  
  if [ $EXIT_CODE -ne 0 ]; then
    FAILED_SUITES+=("$base")
  fi
done

echo
echo "################################################"
echo "# AUDIT SUMMARY"
echo "################################################"
for line in "${SUITE_SUMMARY[@]}"; do
  echo "  $line"
done
echo
echo "  TOTAL PASS: $TOTAL_PASS"
echo "  TOTAL FAIL: $TOTAL_FAIL"
echo

if [ ${#FAILED_SUITES[@]} -gt 0 ]; then
  echo "  FAILED SUITES: ${FAILED_SUITES[*]}"
  exit 1
fi

echo "  ALL SUITES PASSED"
exit 0
