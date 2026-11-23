// ============================================================
// BOOKING CONFIRMATION PARSER (Phase 7.8 Wave D, Phase 8 Batch 3)
// Regex-based extraction for common formats. Each parser is a pure
// function that takes raw text and returns a partial draft.
// Client-side only — no network, no AI. The forms enrich results
// against the catalogs afterwards (airline names, airport
// timezones, ship → cruise line), so anything knowable in advance
// never has to be typed.
// ============================================================

import { addDaysToISODate } from "@/lib/itineraries/dates";

export interface ParsedBooking {
  airline?: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  originTimezone?: string;
  destinationTimezone?: string;
  departureAt?: string;
  arrivalAt?: string;
  reference?: string;
  hotelName?: string;
  hotelAddress?: string;
  checkInDate?: string;
  checkOutDate?: string;
  // Cruise (Phase 8 Batch 3)
  ship?: string;
  cruiseLine?: string;
  cabin?: string;
  deck?: string;
  embarkPort?: string;
  disembarkPort?: string;
  ports?: string[];
}

export interface BookingParseResult {
  source: "air-canada" | "westjet" | "flight-generic" | "cruise" | "hotel-generic" | "unknown";
  booking: ParsedBooking;
  matchedLines: number;
  warnings: string[];
}

// ---------- shared date/time extraction ----------

const MONTH_NUMBERS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const DATE_PATTERN =
  /\b(\d{4})-(\d{2})-(\d{2})\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b|\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{4})\b/gi;

function dateFromMatch(m: RegExpExecArray): string {
  if (m[1]) return `${m[1]}-${m[2]}-${m[3]}`;
  if (m[4]) {
    const month = MONTH_NUMBERS[m[4].toLowerCase().slice(0, 3)];
    return `${m[6]}-${String(month).padStart(2, "0")}-${m[5].padStart(2, "0")}`;
  }
  const month = MONTH_NUMBERS[m[8].toLowerCase().slice(0, 3)];
  return `${m[9]}-${String(month).padStart(2, "0")}-${m[7].padStart(2, "0")}`;
}

/** Normalize a date mention to "YYYY-MM-DD"; null when unrecognized. */
export function parseDateToISO(text: string): string | null {
  // Fresh regex per call: DATE_PATTERN is global and shared with
  // findDates' scan loop — mutating its lastIndex mid-loop would
  // corrupt the scan (this exact bug once hung the parser).
  const m = new RegExp(DATE_PATTERN.source).exec(text);
  return m ? dateFromMatch(m) : null;
}

/** Every distinct date in the text, ISO-normalized, in order. */
export function findDates(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(DATE_PATTERN.source, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const iso = dateFromMatch(m);
    if (iso && !out.includes(iso)) out.push(iso);
  }
  return out;
}

const TIME_PATTERN = /\b(\d{1,2}):(\d{2})\s*([AaPp])\.?[Mm]\.?|\b([01]?\d|2[0-3]):([0-5]\d)\b/g;

/** Every time in the text as "HH:MM" 24-hour, in order. */
export function findTimes(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(TIME_PATTERN.source, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[3]) {
      let h = +m[1] % 12;
      if (m[3].toLowerCase() === "p") h += 12;
      out.push(`${String(h).padStart(2, "0")}:${m[2]}`);
    } else {
      out.push(`${m[4].padStart(2, "0")}:${m[5]}`);
    }
  }
  return out;
}

function findRoute(text: string): { origin: string; destination: string } | null {
  const arrow = text.match(/\b([A-Z]{3})\s*(?:to|-|->|→)\s*([A-Z]{3})\b/);
  if (arrow) return { origin: arrow[1], destination: arrow[2] };
  const parens = text.match(/\(([A-Z]{3})\)[^\n]{0,60}?\(([A-Z]{3})\)/);
  if (parens) return { origin: parens[1], destination: parens[2] };
  return null;
}

function findReference(text: string): string | null {
  const ref = text.match(/(?:confirmation|booking|reference|record locator)[:\s#]*([A-Z0-9]{5,8})/i);
  return ref ? ref[1].toUpperCase() : null;
}

/** Combine the found dates/times into departure/arrival datetimes. */
function fillFlightTimes(booking: ParsedBooking, text: string): void {
  const dates = findDates(text);
  const times = findTimes(text);
  if (dates.length === 0 || times.length === 0) return;
  booking.departureAt = `${dates[0]}T${times[0]}`;
  if (times.length >= 2) {
    let arrivalDate = dates[1] ?? dates[0];
    if (!dates[1] && times[1] <= times[0]) {
      // Landed after midnight local — the confirmation just didn't
      // repeat the date.
      arrivalDate = addDaysToISODate(dates[0], 1) ?? dates[0];
    }
    booking.arrivalAt = `${arrivalDate}T${times[1]}`;
  }
}

// Air Canada: e.g. "AC 0020", "Air Canada", "SIN to YVR", "Confirmation: ABC123"
function parseAirCanada(text: string): ParsedBooking | null {
  const booking: ParsedBooking = {};
  const upper = text.toUpperCase();

  const flightMatch = upper.match(/\bAC\s*(\d{2,4})\b/);
  if (flightMatch) {
    booking.airline = "Air Canada";
    booking.flightNumber = "AC" + flightMatch[1].padStart(4, "0");
  } else {
    return null;
  }

  const route = findRoute(text);
  if (route) {
    booking.origin = route.origin;
    booking.destination = route.destination;
  }

  const ref = findReference(text);
  if (ref) booking.reference = ref;

  fillFlightTimes(booking, text);
  return Object.keys(booking).length > 1 ? booking : null;
}

// WestJet: "WS ####", similar structure
function parseWestJet(text: string): ParsedBooking | null {
  const upper = text.toUpperCase();
  const flightMatch = upper.match(/\bWS\s*(\d{2,4})\b/);
  if (!flightMatch) return null;
  const booking: ParsedBooking = {
    airline: "WestJet",
    flightNumber: "WS" + flightMatch[1],
  };
  const route = findRoute(text);
  if (route) {
    booking.origin = route.origin;
    booking.destination = route.destination;
  }
  const ref = findReference(text);
  if (ref) booking.reference = ref;
  fillFlightTimes(booking, text);
  return booking;
}

// ---------- generic flight (any other airline) ----------

// The carriers a Canadian travel agent pastes most. Anything else
// still parses — the form resolves the name from the full airline
// catalog by code.
const AIRLINE_NAMES: Record<string, string> = {
  DL: "Delta Air Lines", UA: "United Airlines", AA: "American Airlines",
  WN: "Southwest Airlines", AS: "Alaska Airlines", B6: "JetBlue",
  BA: "British Airways", LH: "Lufthansa", AF: "Air France", KL: "KLM",
  EK: "Emirates", QR: "Qatar Airways", EY: "Etihad Airways",
  TK: "Turkish Airlines", SQ: "Singapore Airlines", CX: "Cathay Pacific",
  NH: "ANA", JL: "Japan Airlines", KE: "Korean Air", VS: "Virgin Atlantic",
  IB: "Iberia", LX: "SWISS", TP: "TAP Air Portugal", EI: "Aer Lingus",
  FI: "Icelandair", F8: "Flair Airlines", PD: "Porter Airlines",
  TS: "Air Transat", QF: "Qantas", NZ: "Air New Zealand",
  AM: "Aeromexico", CM: "Copa Airlines", LA: "LATAM", AV: "Avianca",
};

function parseGenericFlight(text: string): ParsedBooking | null {
  const upper = text.toUpperCase();
  const fm = upper.match(/\b([A-Z]{2})\s?(\d{1,4})\b/);
  if (!fm) return null;
  const code = fm[1];
  if (code === "AC" || code === "WS") return null; // brand parsers own these

  const booking: ParsedBooking = { flightNumber: code + fm[2] };
  if (AIRLINE_NAMES[code]) booking.airline = AIRLINE_NAMES[code];

  const route = findRoute(text);
  if (route) {
    booking.origin = route.origin;
    booking.destination = route.destination;
  }
  const ref = findReference(text);
  if (ref) booking.reference = ref;
  fillFlightTimes(booking, text);

  // A bare code+number with nothing else is too weak to claim.
  if (!booking.origin && !booking.departureAt) return null;
  return booking;
}

// ---------- cruise ----------

const CRUISE_LINE_NAMES = [
  "Royal Caribbean", "Carnival Cruise Line", "Carnival", "Norwegian Cruise Line",
  "Norwegian", "MSC Cruises", "Princess Cruises", "Celebrity Cruises",
  "Holland America", "Disney Cruise Line", "Virgin Voyages", "Cunard",
  "Costa Cruises", "Azamara", "Oceania Cruises", "Regent Seven Seas",
  "Silversea", "Seabourn", "Viking", "Windstar", "Ponant", "AIDA", "P&O Cruises",
];

function parseCruise(text: string): ParsedBooking | null {
  const booking: ParsedBooking = {};

  const lineHit = CRUISE_LINE_NAMES.find((name) =>
    text.toLowerCase().includes(name.toLowerCase())
  );
  if (lineHit) booking.cruiseLine = lineHit;

  const shipLabel = text.match(/(?:ship|vessel)[:\s]+([A-Z][A-Za-z'’ .-]{2,40})/);
  if (shipLabel) {
    booking.ship = shipLabel[1].trim().replace(/\s+(sailing|departure|itinerary).*$/i, "");
  } else {
    const seas = text.match(/\b([A-Z][A-Za-z'’]+(?:\s+[A-Z][A-Za-z'’]+){0,2}\s+of the Seas)\b/);
    if (seas) booking.ship = seas[1].trim();
  }

  const trigger = /\b(cruise|sailing|stateroom|embark|disembark)\b/i.test(text);
  if (!booking.ship && !booking.cruiseLine) return null;
  if (!trigger && !booking.ship) return null;

  const cabin = text.match(/(?:cabin|stateroom)(?:\s*(?:number|no\.?|#))?[:\s]*([A-Z]?\d{3,5})\b/i);
  if (cabin) booking.cabin = cabin[1].toUpperCase();
  const deck = text.match(/deck[:\s]*(\d{1,2})\b/i);
  if (deck) booking.deck = deck[1];

  const dates = findDates(text);
  if (dates[0]) booking.checkInDate = dates[0];
  if (dates[1]) booking.checkOutDate = dates[1];

  // Port list: "Day 3: Nassau, Bahamas" lines, wherever they appear.
  const ports: string[] = [];
  for (const rawLine of text.split("\n")) {
    const m = rawLine.match(/^\s*day\s*\d+\s*[:\-–—]\s*(.+)$/i);
    if (m) {
      const port = m[1].trim().replace(/\s*\([^)]*\)\s*$/, "");
      if (port && port.length <= 60) ports.push(port);
    }
  }
  if (ports.length >= 2) {
    booking.ports = ports;
    booking.embarkPort = ports[0].replace(/^(embark|depart)\s+/i, "");
    booking.disembarkPort = ports[ports.length - 1];
  }

  const ref = findReference(text);
  if (ref) booking.reference = ref;
  return booking;
}

// ---------- hotel ----------

function parseHotel(text: string): ParsedBooking | null {
  const hotelChains = /\b(Marriott|Hilton|Hyatt|Westin|Sheraton|Oakwood|InterContinental|Radisson|Novotel|Ibis|Four Seasons|Ritz|Fairmont)\b/i;
  const match = text.match(hotelChains);
  if (!match) return null;

  const booking: ParsedBooking = {};
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length > 0) {
    const chainLine = lines.find((l) => hotelChains.test(l));
    if (chainLine) booking.hotelName = chainLine;
  }

  const addressLine = lines.find((l) => /^\d+\s+\S/.test(l) || /[A-Z]\d[A-Z]\s*\d[A-Z]\d/i.test(l));
  if (addressLine) booking.hotelAddress = addressLine;

  // Labeled dates win; otherwise the first two dates in the text.
  const checkinMatch = text.match(/(?:check[- ]?in|arrival)[:\s]*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
  const checkoutMatch = text.match(/(?:check[- ]?out|departure)[:\s]*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\s+[A-Za-z]+\s+\d{4})/i);
  if (checkinMatch) booking.checkInDate = parseDateToISO(checkinMatch[1]) ?? checkinMatch[1];
  if (checkoutMatch) booking.checkOutDate = parseDateToISO(checkoutMatch[1]) ?? checkoutMatch[1];
  if (!booking.checkInDate || !booking.checkOutDate) {
    const dates = findDates(text);
    if (!booking.checkInDate && dates[0]) booking.checkInDate = dates[0];
    if (!booking.checkOutDate && dates[1]) booking.checkOutDate = dates[1];
  }

  return Object.keys(booking).length > 0 ? booking : null;
}

export function parseBooking(text: string): BookingParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { source: "unknown", booking: {}, matchedLines: 0, warnings: ["Empty input"] };
  }

  const warnings: string[] = [];
  const lineCount = trimmed.split("\n").length;

  const ac = parseAirCanada(trimmed);
  if (ac) return { source: "air-canada", booking: ac, matchedLines: lineCount, warnings };

  const ws = parseWestJet(trimmed);
  if (ws) return { source: "westjet", booking: ws, matchedLines: lineCount, warnings };

  const cruise = parseCruise(trimmed);
  if (cruise) return { source: "cruise", booking: cruise, matchedLines: lineCount, warnings };

  const flight = parseGenericFlight(trimmed);
  if (flight) return { source: "flight-generic", booking: flight, matchedLines: lineCount, warnings };

  const hotel = parseHotel(trimmed);
  if (hotel) return { source: "hotel-generic", booking: hotel, matchedLines: lineCount, warnings };

  warnings.push("Could not identify the format. Try pasting just the flight number and route, the ship and sailing dates, or the hotel name and address.");
  return { source: "unknown", booking: {}, matchedLines: 0, warnings };
}
