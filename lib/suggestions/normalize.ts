// ============================================================
// NORMALIZATION (Phase 7.8)
// Field-specific. Airport codes and flight identifiers are uppercased,
// not title-cased. Hotels/cities get title-case with acronym preservation.
// Freeform fields are trimmed + whitespace-collapsed only.
// ============================================================

function trimCollapse(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function titleCase(s: string): string {
  return trimCollapse(s)
    .split(" ")
    .map((w) => {
      if (w.length === 0) return w;
      if (/^[A-Z]{2,4}$/.test(w)) return w;
      if (/[a-z][A-Z]/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");
}

export function normalizeHotelName(s: string): string {
  return titleCase(s);
}

export function normalizeCityName(s: string): string {
  return titleCase(s);
}

export function normalizeAirportCode(s: string): string {
  return trimCollapse(s).toUpperCase();
}

export function normalizeFlightIdentifier(s: string): string {
  return trimCollapse(s).toUpperCase();
}

export function normalizeOperatorName(s: string): string {
  return titleCase(s);
}

export function normalizeFreeform(s: string): string {
  return trimCollapse(s);
}
