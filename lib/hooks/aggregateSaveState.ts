import type { SaveState } from "@/lib/hooks/useAutosaveField";

/**
 * Aggregate multiple field save states into one global state.
 *
 * Priority order (highest wins):
 *   1. error — if any field errored, the editor is in an error state
 *   2. saving — if any field is saving
 *   3. saved — if all fields are idle or saved (and at least one is saved)
 *   4. idle — otherwise
 */
export function aggregateSaveState(states: SaveState[]): SaveState {
  if (states.length === 0) return "idle";

  if (states.some((s) => s === "error")) return "error";
  if (states.some((s) => s === "saving")) return "saving";

  const anySaved = states.some((s) => s === "saved");
  if (anySaved) return "saved";

  return "idle";
}
