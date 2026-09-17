// One-off: delete all Canvas-era template rows.
// Canvas is frozen and being removed.

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "site.db");
const db = new Database(dbPath);

const before = db.prepare("SELECT COUNT(*) as n FROM templates").get();
console.log("Before:", before.n, "rows");

const result = db.prepare("DELETE FROM templates").run();
console.log("Deleted:", result.changes, "rows");

const after = db.prepare("SELECT COUNT(*) as n FROM templates").get();
console.log("After:", after.n, "rows");

db.close();
console.log("Done.");
