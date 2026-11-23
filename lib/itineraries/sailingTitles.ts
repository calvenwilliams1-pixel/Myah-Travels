// Pure title helpers for sailing-day layout, shared by the server
// layout routine and the admin editor (which prefills the port list
// from existing day titles). No server imports — safe for the client.

const SEA_LINE = /^(at sea|sea day|day at sea|cruising|sailing)$/i;

export function isSeaLine(line: string): boolean {
  return SEA_LINE.test(line.trim());
}

/** The day title for one line of the port list. */
export function sailingDayTitle(line: string, index: number, total: number): string {
  const port = line.trim();
  if (isSeaLine(port)) return "At Sea";
  if (index === 0) return `Embark — ${port}`;
  if (index === total - 1) return `Disembark — ${port}`;
  return port;
}

/**
 * Strip a generated title back to the port-list line it came from, so
 * the editor can prefill the list from days that are already laid out.
 */
export function portLineFromTitle(title: string | null): string {
  if (!title) return "";
  if (title === "At Sea") return "At sea";
  return title.replace(/^(Embark|Disembark) — /, "");
}
