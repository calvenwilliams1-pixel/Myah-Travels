import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db, sqlite } from "./index";

export function runMigrations() {
  console.log("Running database migrations...");
  
  migrate(db, {
    migrationsFolder: "./drizzle/migrations",
  });
  
  console.log("Migrations complete.");
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  runMigrations();
  sqlite.close();
}
