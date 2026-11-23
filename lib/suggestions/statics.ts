import fs from "fs";
import path from "path";

// ============================================================
// STATIC DATASETS (Phase 7.8)
// Airports and airlines loaded into memory at first access.
// Source files regenerate via scripts/fetch-static-data.js.
// ============================================================

export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone?: string;
  lat?: number | null;
  lon?: number | null;
}

export interface Airline {
  iata: string;
  icao: string;
  name: string;
  country: string;
}

export interface CruiseLine {
  name: string;
  ships: string[];
}

export interface ShipMatch {
  ship: string;
  line: string;
}

export interface ResortBrand {
  name: string;
}

interface StaticFile<T> {
  _generated: boolean;
  _source?: string;
  _license?: string;
  items: T[];
}

let airportsCache: Airport[] | null = null;
let airlinesCache: Airline[] | null = null;
let cruiseLinesCache: CruiseLine[] | null = null;
let resortBrandsCache: ResortBrand[] | null = null;
let lastLoadError: string | null = null;

/**
 * Returns true when the static dataset failed to load. The suggestion
 * endpoint surfaces this to the client so autocomplete can degrade
 * visibly (shows "static suggestions unavailable") rather than silently
 * returning an empty list.
 */
export function hasStaticLoadError(): boolean {
  return lastLoadError !== null;
}

export function getStaticLoadError(): string | null {
  return lastLoadError;
}

function loadFile<T>(filename: string): T[] {
  try {
    const fullPath = path.join(process.cwd(), "data", filename);
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw) as StaticFile<T>;
    return parsed.items ?? [];
  } catch (err) {
    lastLoadError = (err as Error).message;
    console.warn("[suggestions] failed to load " + filename + ":", lastLoadError);
    return [];
  }
}

export function getAirports(): Airport[] {
  if (airportsCache === null) airportsCache = loadFile<Airport>("airports.json");
  return airportsCache;
}

export function getAirlines(): Airline[] {
  if (airlinesCache === null) airlinesCache = loadFile<Airline>("airlines.json");
  return airlinesCache;
}

export function getCruiseLines(): CruiseLine[] {
  if (cruiseLinesCache === null) cruiseLinesCache = loadFile<CruiseLine>("cruise-lines.json");
  return cruiseLinesCache;
}

export function getResortBrands(): ResortBrand[] {
  if (resortBrandsCache === null) resortBrandsCache = loadFile<ResortBrand>("resort-brands.json");
  return resortBrandsCache;
}

export function searchAirports(query: string, limit = 8): Airport[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  // Rank exact code matches first: with thousands of airports, a typed
  // IATA code is a substring of unrelated names/cities elsewhere, and
  // the airport the code actually belongs to must win.
  const exact: Airport[] = [];
  const prefix: Airport[] = [];
  const rest: Airport[] = [];
  for (const a of getAirports()) {
    const iata = a.iata.toLowerCase();
    if (iata === q) exact.push(a);
    else if (iata.startsWith(q)) prefix.push(a);
    else if (
      iata.includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.city && a.city.toLowerCase().includes(q))
    )
      rest.push(a);
  }
  return [...exact, ...prefix, ...rest].slice(0, limit);
}

export function searchAirlines(query: string, limit = 8): Airline[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const exact: Airline[] = [];
  const prefix: Airline[] = [];
  const rest: Airline[] = [];
  for (const a of getAirlines()) {
    const iata = a.iata.toLowerCase();
    const icao = a.icao.toLowerCase();
    if (iata === q || icao === q) exact.push(a);
    else if (iata.startsWith(q) || icao.startsWith(q)) prefix.push(a);
    else if (iata.includes(q) || icao.includes(q) || a.name.toLowerCase().includes(q)) rest.push(a);
  }
  return [...exact, ...prefix, ...rest].slice(0, limit);
}

export function searchCruiseLines(query: string, limit = 8): CruiseLine[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return getCruiseLines()
    .filter((l) => l.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function searchShips(query: string, limit = 8): ShipMatch[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const out: ShipMatch[] = [];
  for (const line of getCruiseLines()) {
    for (const ship of line.ships) {
      if (ship.toLowerCase().includes(q)) out.push({ ship, line: line.name });
      if (out.length >= limit) return out;
    }
  }
  return out;
}

export function searchResortBrands(query: string, limit = 8): ResortBrand[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return getResortBrands()
    .filter((b) => b.name.toLowerCase().includes(q))
    .slice(0, limit);
}
