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

db.close();
console.log("\n✅ Database setup complete: data/site.db");
console.log("Next: run npm run seed");
