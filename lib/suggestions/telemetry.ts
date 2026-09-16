// ============================================================
// TELEMETRY HELPER (Phase 7.8)
// Fire-and-forget POST to /api/suggestions/telemetry. Never blocks
// or throws — a telemetry failure must not affect the user.
// ============================================================

export type SuggestionEvent = "accepted" | "typed_fresh";

export function logSuggestionEvent(
  fieldKey: string,
  event: SuggestionEvent,
  value?: string
): void {
  if (process.env.NEXT_PUBLIC_AUTOCOMPLETE_ENABLED === "false") return;
  try {
    void fetch("/api/suggestions/telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldKey, event, value }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow
  }
}
