// One-off: delete all Canvas-era template rows from the templates table.
// Canvas is frozen and being removed. These rows have a layout_data shape
// that the block template system can't parse, so they break the editor.
//
// Run once: node scripts/cleanup-canvas-templates.js

const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data", "site.db");
const db = new Database(dbPath);

const before = db.prepare("SELECT COUNT(*) as n FROM templates").get();
console.log("Before:", before.n, "rows");

// Delete every row. Canvas is dead; block templates are seeded fresh
// by scripts/seed-templates.ts.
const result = db.prepare("DELETE FROM templates").run();
console.log("Deleted:", result.changes, "rows");

const after = db.prepare("SELECT COUNT(*) as n FROM templates").get();
console.log("After:", after.n, "rows");

db.close();
console.log("Done.");
