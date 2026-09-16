// ============================================================
// BOOKING CONFIRMATION PARSER (Phase 7.8 Wave D)
// Regex-based extraction for common formats. Each parser is a pure
// function that takes raw text and returns a partial segment draft.
// Client-side only — no network, no AI.
// ============================================================

export interface ParsedBooking {
  airline?: string;
  flightNumber?: string;
  origin?: string;
  destination?: string;
  departureAt?: string;
  arrivalAt?: string;
  reference?: string;
  hotelName?: string;
  hotelAddress?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface BookingParseResult {
  source: "air-canada" | "westjet" | "hotel-generic" | "unknown";
  booking: ParsedBooking;
  matchedLines: number;
  warnings: string[];
}

// Air Canada: e.g. "AC 0020", "Air Canada", "SIN to YVR", "Confirmation: ABC123"
function parseAirCanada(text: string): ParsedBooking | null {
  const booking: ParsedBooking = {};
  const upper = text.toUpperCase();

  // Flight number: AC followed by digits, optional space
  const flightMatch = upper.match(/\bAC\s*(\d{2,4})\b/);
  if (flightMatch) {
    booking.airline = "Air Canada";
    booking.flightNumber = "AC" + flightMatch[1].padStart(4, "0");
  } else {
    return null;
  }

  // Route: "YYZ to NRT" or "YYZ - NRT" or "YYZ -> NRT"
  const routeMatch = text.match(/\b([A-Z]{3})\s*(?:to|-|->|\u2192)\s*([A-Z]{3})\b/);
  if (routeMatch) {
    booking.origin = routeMatch[1];
    booking.destination = routeMatch[2];
  }

  // Reference/confirmation: alphanumeric 5-8 chars near "confirmation" or "booking"
  const refMatch = text.match(/(?:confirmation|booking|reference)[:\s#]*([A-Z0-9]{5,8})/i);
  if (refMatch) booking.reference = refMatch[1].toUpperCase();

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
  const routeMatch = text.match(/\b([A-Z]{3})\s*(?:to|-|->|\u2192)\s*([A-Z]{3})\b/);
  if (routeMatch) {
    booking.origin = routeMatch[1];
    booking.destination = routeMatch[2];
  }
  const refMatch = text.match(/(?:confirmation|booking|reference)[:\s#]*([A-Z0-9]{5,8})/i);
  if (refMatch) booking.reference = refMatch[1].toUpperCase();
  return booking;
}

// Hotel: "Marriott", "Hilton", "Hyatt", "Oakwood", etc with address line
function parseHotel(text: string): ParsedBooking | null {
  const hotelChains = /\b(Marriott|Hilton|Hyatt|Westin|Sheraton|Oakwood|InterContinental|Radisson|Novotel|Ibis|Four Seasons|Ritz|Fairmont)\b/i;
  const match = text.match(hotelChains);
  if (!match) return null;

  const booking: ParsedBooking = {};

  // Best guess: first non-empty line as hotel name
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length > 0) {
    // Find the line containing the chain name
    const chainLine = lines.find((l) => hotelChains.test(l));
    if (chainLine) booking.hotelName = chainLine;
  }

  // Address: line starting with a digit or containing a postal code
  const addressLine = lines.find((l) => /^\d+\s+\S/.test(l) || /[A-Z]\d[A-Z]\s*\d[A-Z]\d/i.test(l));
  if (addressLine) booking.hotelAddress = addressLine;

  // Check-in / check-out dates
  const checkinMatch = text.match(/(?:check[- ]?in)[:\s]*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (checkinMatch) booking.checkInDate = checkinMatch[1];
  const checkoutMatch = text.match(/(?:check[- ]?out)[:\s]*([A-Za-z]+\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (checkoutMatch) booking.checkOutDate = checkoutMatch[1];

  return Object.keys(booking).length > 0 ? booking : null;
}

export function parseBooking(text: string): BookingParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { source: "unknown", booking: {}, matchedLines: 0, warnings: ["Empty input"] };
  }

  const warnings: string[] = [];

  const ac = parseAirCanada(trimmed);
  if (ac) {
    return { source: "air-canada", booking: ac, matchedLines: trimmed.split("\n").length, warnings };
  }

  const ws = parseWestJet(trimmed);
  if (ws) {
    return { source: "westjet", booking: ws, matchedLines: trimmed.split("\n").length, warnings };
  }

  const hotel = parseHotel(trimmed);
  if (hotel) {
    return { source: "hotel-generic", booking: hotel, matchedLines: trimmed.split("\n").length, warnings };
  }

  warnings.push("Could not identify the format. Try pasting just the flight number and route, or the hotel name and address.");
  return { source: "unknown", booking: {}, matchedLines: 0, warnings };
}
