// Seeds (or replaces) the homepage welcome canvas with the starter design
// in scripts/starter-homepage-canvas.json. The owner can then reshape it
// freely in Admin → Homepage. Usage: node scripts/set-homepage-starter.mjs
import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const here = dirname(fileURLToPath(import.meta.url));
const doc = readFileSync(join(here, "starter-homepage-canvas.json"), "utf8");
JSON.parse(doc); // fail fast on invalid JSON

const db = new Database(join(here, "..", "data", "site.db"));
db.prepare(
  `INSERT INTO settings (key, value) VALUES ('homepage_canvas', ?)
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
).run(doc);
console.log("homepage_canvas set from starter-homepage-canvas.json");
