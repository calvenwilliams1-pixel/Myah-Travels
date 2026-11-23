"use client";

import { useRef } from "react";
import type { SuggestionItem } from "@/components/ui/SuggestionDropdown";

// ============================================================
// useSuggestions — fetches from entities, statics, field-values,
// merges, dedupes, ranks (entity > static > field_value).
// Returns a function that resolves to the ranked suggestion list.
// ============================================================

export function useSuggestions() {
  const requestIdRef = useRef(0);

  async function fetchSuggestions(
    fieldKey: string,
    query: string,
    entityKind?: string
  ): Promise<SuggestionItem[]> {
    const myId = ++requestIdRef.current;
    const q = query.trim();

    const tasks: Promise<SuggestionItem[]>[] = [];

    if (entityKind) {
      tasks.push(
        fetch(
          "/api/suggestions/entities?kind=" +
            encodeURIComponent(entityKind) +
            "&q=" +
            encodeURIComponent(q)
        )
          .then((r) => r.json())
          .then((d) =>
            (d.items || []).map((it: any) => ({
              value: it.canonicalName,
              subtitle: it.identity?.address || it.identity?.city || undefined,
              payload: { ...(it.identity || {}), ...(it.defaults || {}) },
              source: "entity" as const,
            }))
          )
          .catch(() => [])
      );
    }

    tasks.push(
      fetch(
        "/api/suggestions/statics?field=" +
          encodeURIComponent(fieldKey) +
          "&q=" +
          encodeURIComponent(q)
      )
        .then((r) => r.json())
        .then((d) =>
          (d.items || []).map((it: any) => ({
            // Airports render "CODE · Name"; ships arrive as {ship, line};
            // everything else carries a plain name.
            value: it.iata ? it.iata + " · " + it.name : (it.name ?? it.ship),
            subtitle: it.city ? it.city + ", " + it.country : (it.country ?? it.line),
            // Accepting a suggestion can fill a sibling field: an airport
            // carries its IANA timezone (→ the leg's timezone field), a
            // ship carries its cruise line (→ the stay's line field).
            payload:
              it.timezone || it.line
                ? {
                    ...(it.timezone ? { timezone: it.timezone } : {}),
                    ...(it.line ? { line: it.line } : {}),
                  }
                : undefined,
            source: "static" as const,
          }))
        )
        .catch(() => [])
    );

    if (q) {
      tasks.push(
        fetch(
          "/api/suggestions/field-values?field=" +
            encodeURIComponent(fieldKey) +
            "&q=" +
            encodeURIComponent(q)
        )
          .then((r) => r.json())
          .then((d) =>
            (d.items || []).map((it: any) => ({
              value: it.value,
              source: "field_value" as const,
            }))
          )
          .catch(() => [])
      );
    }

    const results = await Promise.all(tasks);
    if (myId !== requestIdRef.current) return []; // stale

    const merged: SuggestionItem[] = [];
    const seen = new Set<string>();
    const order: Array<"entity" | "static" | "field_value"> = ["entity", "static", "field_value"];
    for (const src of order) {
      for (const bucket of results) {
        for (const item of bucket) {
          if (item.source !== src) continue;
          if (seen.has(item.value)) continue;
          seen.add(item.value);
          merged.push(item);
        }
      }
    }

    return merged.slice(0, 8);
  }

  return { fetchSuggestions };
}
