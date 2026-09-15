const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "site.db");

// Create data dir if missing
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

console.log("Creating database from schema.sql...");
const schema = fs.readFileSync(path.join(__dirname, "..", "schema.sql"), "utf8");
db.exec(schema);
console.log("✓ Base schema applied");

console.log("Applying migrations...");
const migrationsDir = path.join(__dirname, "..", "drizzle", "migrations");
const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

for (const file of migrations) {
  console.log(`  Applying ${file}...`);
  try {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    db.exec(sql);
    console.log(`  ✓ ${file}`);
  } catch (err) {
    if (err.message.includes("already exists") || err.message.includes("duplicate column")) {
      console.log(`  ⚠ ${file} (already applied, skipping)`);
    } else {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }
}

// Add columns that aren't in schema.sql yet
console.log("Checking for missing columns...");

const requiredColumns = [
  { table: "portal_members", column: "opt_out_global_announcement", type: "INTEGER DEFAULT 0" },
  { table: "guides", column: "expires_at", type: "TEXT" },
  { table: "guides", column: "is_expired", type: "INTEGER DEFAULT 0" },
  { table: "tags", column: "is_favourite", type: "INTEGER DEFAULT 0" },
  { table: "tags", column: "last_used_at", type: "TEXT" },
  { table: "email_queue", column: "last_attempt_at", type: "TEXT" },
  { table: "itinerary_segments", column: "reference_type", type: "TEXT" },
  { table: "itinerary_segments", column: "reference_label", type: "TEXT" },
  { table: "portal_members", column: "status", type: "TEXT NOT NULL DEFAULT 'active'" },
  { table: "portal_members", column: "banned_at", type: "TEXT" },
  { table: "portal_members", column: "ban_reason", type: "TEXT" },
  { table: "portal_members", column: "link_revoked_at", type: "TEXT" },
  { table: "itineraries", column: "theme_preset", type: "TEXT" },
  { table: "itinerary_sections", column: "theme_preset_override", type: "TEXT" },
  { table: "itinerary_segments", column: "is_highlighted", type: "INTEGER DEFAULT 0" },
];

for (const { table, column, type } of requiredColumns) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    const hasColumn = info.some(c => c.name === column);
    if (!hasColumn) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`  ✓ Added ${table}.${column}`);
    }
  } catch (err) {
    console.log(`  ⚠ Could not check ${table}.${column}: ${err.message}`);
  }
}


// Ensure itinerary_travel_legs exists (Phase 7.6.4/7.6.5)
try {
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
    CREATE INDEX IF NOT EXISTS idx_travel_legs_segment_id
      ON itinerary_travel_legs(segment_id);
    CREATE INDEX IF NOT EXISTS idx_travel_legs_leg_order
      ON itinerary_travel_legs(segment_id, leg_order);
  `);
  console.log("  itinerary_travel_legs ready");
} catch (err) {
  console.error("  itinerary_travel_legs:", err.message);
}


// Ensure itinerary_blocks exists (Phase 7.6.9)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS itinerary_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itinerary_id INTEGER NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
      section_id INTEGER REFERENCES itinerary_sections(id) ON DELETE CASCADE,
      day_id INTEGER REFERENCES itinerary_days(id) ON DELETE CASCADE,
      block_type TEXT NOT NULL,
      slot TEXT NOT NULL,
      position INTEGER DEFAULT 0,
      image_url TEXT,
      image_alt TEXT,
      text_content TEXT,
      variant TEXT,
      size TEXT NOT NULL DEFAULT 'medium',
      palette_override TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CHECK (section_id IS NOT NULL OR day_id IS NOT NULL),
      CHECK (NOT (section_id IS NOT NULL AND day_id IS NOT NULL))
    );
    CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_itinerary_id ON itinerary_blocks(itinerary_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_section_id ON itinerary_blocks(section_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_blocks_day_id ON itinerary_blocks(day_id);
  `);
  console.log("  itinerary_blocks ready");
} catch (err) {
  console.error("  itinerary_blocks:", err.message);
}

db.close();
console.log("\n✅ Database setup complete: data/site.db");
console.log("Next: run npm run seed");
