// ============================================================
// SUGGESTION CONFIG (Phase 7.8)
// Server-side flags controlling the suggestion system.
// ============================================================

/**
 * Kill switch. When false, the client components should fall back to
 * plain text inputs. Checked at render time so flipping the env var
 * and restarting the server is enough to disable suggestions.
 *
 * Defaults to true if not set.
 */
export function isAutocompleteEnabled(): boolean {
  const raw = process.env.AUTOCOMPLETE_ENABLED;
  if (raw === undefined || raw === "") return true;
  return raw !== "false" && raw !== "0";
}
