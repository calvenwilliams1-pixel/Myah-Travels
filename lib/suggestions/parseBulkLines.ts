// ============================================================
// BULK-ADD LINE PARSER (Phase 7.8 Wave C)
// Parses pipe- or tab-delimited lines into segment drafts.
// Returns { segments, errors, warnings } — errors block the batch,
// warnings do not.
//
// Formats accepted:
//   HH:MM-HH:MM | Title | Location | Notes
//   HH:MM-HH:MM | travel/flight | YYZ -> NRT | AC009 | REF
//   HH:MM Title
// Tab-separated variants accepted with the same column order.
// ============================================================

export interface ParsedLeg {
  travelMode: "flight" | "train" | "bus" | "transfer" | "other";
  origin: string;
  destination: string;
  identifier: string;
  reference: string;
  departureAt: string;
  arrivalAt: string;
}

export interface ParsedSegment {
  type: "activity" | "travel" | "meal" | "free_day";
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  notes: string;
  leg?: ParsedLeg;
}

export interface ParseResult {
  segments: ParsedSegment[];
  errors: Array<{ line: number; reason: string; raw: string }>;
  warnings: Array<{ line: number; reason: string; raw: string }>;
}

function splitColumns(raw: string): string[] {
  if (raw.includes("|")) return raw.split("|").map((c) => c.trim());
  if (raw.includes("\t")) return raw.split("\t").map((c) => c.trim());
  return [raw.trim()];
}

function parseTimeRange(s: string): { start: string; end: string } | null {
  const m = s.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, sh, sm, eh, em] = m;
  return {
    start: sh.padStart(2, "0") + ":" + sm,
    end: eh.padStart(2, "0") + ":" + em,
  };
}

function parseSingleTime(s: string): string | null {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  return m[1].padStart(2, "0") + ":" + m[2];
}

export function parseBulkLines(input: string, dayDate: string): ParseResult {
  const segments: ParsedSegment[] = [];
  const errors: ParseResult["errors"] = [];
  const warnings: ParseResult["warnings"] = [];

  const rawLines = input.split("\n").map((l) => l.trim());
  let lineNumber = 0;

  for (const raw of rawLines) {
    lineNumber += 1;
    if (!raw || raw.startsWith("#")) continue;

    const cols = splitColumns(raw);

    if (cols.length === 0) continue;

    // Determine structure: first column is either a time range, a single
    // time, or (fallback) a title.
    let type: ParsedSegment["type"] = "activity";
    let startTime = "";
    let endTime = "";
    let title = "";
    let location = "";
    let notes = "";
    let leg: ParsedLeg | undefined;

    const first = cols[0];
    const range = parseTimeRange(first);
    const single = parseSingleTime(first);

    if (range) {
      startTime = range.start;
      endTime = range.end;

      if (cols.length >= 2) {
        // Second column may be "travel/flight" etc.
        const second = cols[1];
        const travelModeMatch = second.match(/^travel\/(flight|train|bus|transfer|other)$/i);
        if (travelModeMatch) {
          type = "travel";
          const mode = travelModeMatch[1].toLowerCase() as ParsedLeg["travelMode"];
          // cols: HH:MM-HH:MM | travel/mode | ORIGIN -> DEST | ID | REF
          const route = cols[2] || "";
          const routeMatch = route.split(/\s*->\s*|\s*\u2192\s*/);
          if (routeMatch.length < 2) {
            errors.push({ line: lineNumber, reason: "Travel leg needs 'ORIGIN -> DEST' in column 3", raw });
            continue;
          }
          const origin = routeMatch[0].trim();
          const destination = routeMatch[1].trim();
          const identifier = cols[3] || "";
          const reference = cols[4] || "";
          leg = {
            travelMode: mode,
            origin,
            destination,
            identifier,
            reference,
            departureAt: dayDate + "T" + startTime,
            arrivalAt: dayDate + "T" + endTime,
          };
          title = identifier ? identifier + " " + origin + " to " + destination : origin + " to " + destination;
        } else {
          // Standard: HH:MM-HH:MM | Title | Location | Notes
          title = cols[1] || "";
          location = cols[2] || "";
          notes = cols[3] || "";
        }
      }
    } else if (single) {
      startTime = single;
      title = cols[1] || cols.slice(1).join(" ").trim();
    } else {
      // No time — treat as a title-only line
      title = cols.join(" ").trim();
      warnings.push({ line: lineNumber, reason: "No time — segment saved with no start time", raw });
    }

    if (!title) {
      errors.push({ line: lineNumber, reason: "Title is required", raw });
      continue;
    }

    segments.push({
      type,
      startTime,
      endTime,
      title,
      location,
      notes,
      leg,
    });
  }

  return { segments, errors, warnings };
}
