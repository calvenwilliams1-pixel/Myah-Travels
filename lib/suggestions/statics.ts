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

interface StaticFile<T> {
  _generated: boolean;
  _source?: string;
  _license?: string;
  items: T[];
}

let airportsCache: Airport[] | null = null;
let airlinesCache: Airline[] | null = null;

function loadFile<T>(filename: string): T[] {
  try {
    const fullPath = path.join(process.cwd(), "data", filename);
    const raw = fs.readFileSync(fullPath, "utf8");
    const parsed = JSON.parse(raw) as StaticFile<T>;
    return parsed.items ?? [];
  } catch (err) {
    console.warn("[suggestions] failed to load " + filename + ":", (err as Error).message);
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

export function searchAirports(query: string, limit = 8): Airport[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return getAirports()
    .filter(
      (a) =>
        a.iata.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        (a.city && a.city.toLowerCase().includes(q))
    )
    .slice(0, limit);
}

export function searchAirlines(query: string, limit = 8): Airline[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return getAirlines()
    .filter(
      (a) =>
        a.iata.toLowerCase().includes(q) ||
        a.icao.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
