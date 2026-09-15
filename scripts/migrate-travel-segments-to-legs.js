// One-off data migration: backfill existing travel segments into
// itinerary_travel_legs with a single leg each (leg_order = 1).
// Idempotent — skips segments that already have any legs.
//
// Run: node scripts/migrate-travel-segments-to-legs.js

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "site.db");
const db = new Database(dbPath);

function run() {
  console.log("Migrating travel segments -> legs...");

  db.exec(`
    CREATE TABLE IF NOT EXISTS itinerary_travel_legs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      segment_id INTEGER NOT NULL REFERENCES itinerary_segments(id) ON DELETE CASCADE,
      leg_order INTEGER NOT NULL,
      travel_mode TEXT NOT NULL,
      origin TEXT,
      destination TEXT,
      departure_at TEXT,
      arrival_at TEXT,
      origin_timezone TEXT,
      destination_timezone TEXT,
      operator TEXT,
      identifier TEXT,
      reference TEXT
    );
  `);

  const segments = db
    .prepare("SELECT * FROM itinerary_segments WHERE type = 'travel'")
    .all();

  let migrated = 0;
  let skipped = 0;

  for (const seg of segments) {
    const existing = db
      .prepare("SELECT COUNT(*) AS n FROM itinerary_travel_legs WHERE segment_id = ?")
      .get(seg.id);

    if (existing.n > 0) {
      skipped++;
      continue;
    }

    db.prepare(`
      INSERT INTO itinerary_travel_legs
        (segment_id, leg_order, travel_mode, origin, destination,
         departure_at, arrival_at, origin_timezone, destination_timezone,
         operator, identifier, reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      seg.id,
      1,
      "flight",
      seg.departure_airport ?? null,
      seg.arrival_airport ?? null,
      seg.departure_datetime ?? null,
      seg.arrival_datetime ?? null,
      null,
      null,
      seg.airline ?? null,
      seg.flight_number ?? null,
      seg.confirmation ?? null
    );

    migrated++;
  }

  console.log(`  Migrated ${migrated} segment(s)`);
  if (skipped > 0) console.log(`  Skipped ${skipped} segment(s) (already have legs)`);

  const orphans = db.prepare(`
    SELECT s.id FROM itinerary_segments s
    LEFT JOIN itinerary_travel_legs l ON l.segment_id = s.id
    WHERE s.type = 'travel' AND l.id IS NULL
  `).all();

  if (orphans.length > 0) {
    console.error("  INVARIANT VIOLATED: travel segments without legs:", orphans.map(o => o.id));
    process.exit(1);
  }

  console.log("  Invariant satisfied: every travel segment has at least one leg");
  db.close();
}

try {
  run();
} catch (err) {
  console.error("Migration failed:", err);
  db.close();
  process.exit(1);
}
