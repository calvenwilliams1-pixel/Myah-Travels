// ============================================================
// BACKFILL MIGRATION (Phase 7.8)
// Walks existing stays, segments, travel legs and populates the
// entities + field_values tables so the suggestion system starts
// with what Myah has already typed, not empty.
//
// Idempotent: re-running replaces counts from the fresh aggregate.
//
// Run: node scripts/backfill-suggestions.js
// ============================================================

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "site.db");
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function trimCollapse(s) {
  return String(s ?? "").trim().replace(/\s+/g, " ");
}

function titleCase(s) {
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

const norm = {
  hotelName: titleCase,
  city: titleCase,
  airportCode: (s) => trimCollapse(s).toUpperCase(),
  flightIdentifier: (s) => trimCollapse(s).toUpperCase(),
  operator: titleCase,
  freeform: trimCollapse,
};

const FIELD_KEYS = {
  SEGMENT_TITLE: "segment.title",
  SEGMENT_LOCATION: "segment.location",
  SEGMENT_REFERENCE_LABEL: "segment.reference_label",
  LEG_ORIGIN: "leg.origin",
  LEG_DESTINATION: "leg.destination",
  LEG_OPERATOR: "leg.operator",
  LEG_IDENTIFIER: "leg.identifier",
  STAY_HOTEL_NAME: "stay.hotel_name",
  STAY_ADDRESS: "stay.address",
  STAY_NOTES: "stay.notes",
  SECTION_TITLE: "section.title",
  SECTION_BASE_CITY: "section.base_city",
  DAY_TITLE: "day.title",
};

const fieldValueCounts = new Map();
const entityCounts = new Map();

function normForField(fieldKey, rawValue) {
  switch (fieldKey) {
    case FIELD_KEYS.STAY_HOTEL_NAME: return norm.hotelName(rawValue);
    case FIELD_KEYS.STAY_ADDRESS: return norm.freeform(rawValue);
    case FIELD_KEYS.STAY_NOTES: return norm.freeform(rawValue);
    case FIELD_KEYS.SECTION_BASE_CITY: return norm.city(rawValue);
    case FIELD_KEYS.SECTION_TITLE: return norm.freeform(rawValue);
    case FIELD_KEYS.DAY_TITLE: return norm.freeform(rawValue);
    case FIELD_KEYS.SEGMENT_TITLE: return norm.freeform(rawValue);
    case FIELD_KEYS.SEGMENT_LOCATION: return norm.freeform(rawValue);
    case FIELD_KEYS.SEGMENT_REFERENCE_LABEL: return norm.freeform(rawValue);
    case FIELD_KEYS.LEG_ORIGIN: return norm.airportCode(rawValue);
    case FIELD_KEYS.LEG_DESTINATION: return norm.airportCode(rawValue);
    case FIELD_KEYS.LEG_OPERATOR: return norm.operator(rawValue);
    case FIELD_KEYS.LEG_IDENTIFIER: return norm.flightIdentifier(rawValue);
    default: return norm.freeform(rawValue);
  }
}

function recordField(fieldKey, rawValue) {
  if (!rawValue) return;
  const value = normForField(fieldKey, rawValue);
  if (!value) return;
  const k = fieldKey + "\x00" + value;
  const existing = fieldValueCounts.get(k);
  if (existing) existing.count += 1;
  else fieldValueCounts.set(k, { fieldKey, value, count: 1 });
}

function recordEntity(kind, canonicalName, identity) {
  if (!canonicalName) return;
  const k = kind + "\x00" + canonicalName;
  const existing = entityCounts.get(k);
  if (existing) {
    existing.count += 1;
    if (identity) {
      for (const [key, val] of Object.entries(identity)) {
        if (val && !existing.identity[key]) existing.identity[key] = val;
      }
    }
  } else {
    entityCounts.set(k, { kind, canonicalName, identity: identity || {}, count: 1 });
  }
}

function backfillStays() {
  const rows = db.prepare("SELECT hotel_name, address, notes FROM itinerary_stays").all();
  for (const r of rows) {
    recordField(FIELD_KEYS.STAY_HOTEL_NAME, r.hotel_name);
    recordField(FIELD_KEYS.STAY_ADDRESS, r.address);
    recordField(FIELD_KEYS.STAY_NOTES, r.notes);
    if (r.hotel_name) {
      const identity = {};
      if (r.address) identity.address = norm.freeform(r.address);
      recordEntity("hotel", norm.hotelName(r.hotel_name), identity);
    }
  }
  return rows.length;
}

function backfillSegments() {
  const rows = db.prepare("SELECT title, location, reference_label FROM itinerary_segments").all();
  for (const r of rows) {
    recordField(FIELD_KEYS.SEGMENT_TITLE, r.title);
    recordField(FIELD_KEYS.SEGMENT_LOCATION, r.location);
    recordField(FIELD_KEYS.SEGMENT_REFERENCE_LABEL, r.reference_label);
  }
  return rows.length;
}

function backfillLegs() {
  const rows = db.prepare("SELECT origin, destination, operator, identifier FROM itinerary_travel_legs").all();
  for (const r of rows) {
    recordField(FIELD_KEYS.LEG_ORIGIN, r.origin);
    recordField(FIELD_KEYS.LEG_DESTINATION, r.destination);
    recordField(FIELD_KEYS.LEG_OPERATOR, r.operator);
    recordField(FIELD_KEYS.LEG_IDENTIFIER, r.identifier);
    if (r.operator) recordEntity("airline", norm.operator(r.operator), {});
  }
  return rows.length;
}

function backfillSections() {
  const rows = db.prepare("SELECT title, base_city FROM itinerary_sections").all();
  for (const r of rows) {
    recordField(FIELD_KEYS.SECTION_TITLE, r.title);
    recordField(FIELD_KEYS.SECTION_BASE_CITY, r.base_city);
    if (r.base_city) recordEntity("city", norm.city(r.base_city), {});
  }
  return rows.length;
}

function backfillDays() {
  const rows = db.prepare("SELECT title FROM itinerary_days").all();
  for (const r of rows) {
    recordField(FIELD_KEYS.DAY_TITLE, r.title);
  }
  return rows.length;
}

function flushFieldValues() {
  const insert = db.prepare(`
    INSERT INTO field_values (field_key, value, source, use_count, last_used_at)
    VALUES (?, ?, 'migration', ?, ?)
    ON CONFLICT(field_key, value) DO UPDATE SET
      use_count = excluded.use_count,
      last_used_at = excluded.last_used_at
  `);
  const now = new Date().toISOString();
  let written = 0;
  for (const entry of fieldValueCounts.values()) {
    insert.run(entry.fieldKey, entry.value, entry.count, now);
    written++;
  }
  return written;
}

function flushEntities() {
  const insert = db.prepare(`
    INSERT INTO entities (kind, canonical_name, identity, defaults, source, use_count, last_used_at)
    VALUES (?, ?, ?, NULL, 'migration', ?, ?)
    ON CONFLICT(kind, canonical_name) DO UPDATE SET
      identity = excluded.identity,
      use_count = excluded.use_count,
      last_used_at = excluded.last_used_at
  `);
  const now = new Date().toISOString();
  let written = 0;
  for (const entry of entityCounts.values()) {
    insert.run(entry.kind, entry.canonicalName, JSON.stringify(entry.identity), entry.count, now);
    written++;
  }
  return written;
}

function run() {
  console.log("Backfilling suggestions from existing data...");
  const staysCount = backfillStays();
  const segmentsCount = backfillSegments();
  const legsCount = backfillLegs();
  const sectionsCount = backfillSections();
  const daysCount = backfillDays();
  console.log("  Walked: " + staysCount + " stays, " + segmentsCount + " segments, " + legsCount + " legs, " + sectionsCount + " sections, " + daysCount + " days");
  const fv = flushFieldValues();
  const en = flushEntities();
  console.log("  Wrote: " + fv + " field values, " + en + " entities");
  console.log("Done. All tagged source = 'migration'.");
  db.close();
}

try {
  run();
} catch (err) {
  console.error("Backfill failed:", err);
  db.close();
  process.exit(1);
}
