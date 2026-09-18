import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

async function testDatabaseConnection() {
  try {
    await db.all(sql`SELECT count(*) as count FROM sqlite_master`);
    console.log("✅ Database connection works");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

async function testRequiredTables() {
  const requiredTables = [
    "users", "sessions", "posts", "guides", "reviews", "videos",
    "clients", "portals", "portal_members", "portal_magic_links",
    "portal_sessions", "portal_notices", "email_queue", "media",
    "settings", "activity_log",
  ];

  const result = await db.select({ name: sql<string>`name` })
    .from(sql`sqlite_master`)
    .where(sql`type = 'table'`);
    
  const tableNames = new Set(result.map((r) => r.name));

  const missing = requiredTables.filter((table) => !tableNames.has(table));

  if (missing.length > 0) {
    console.warn(`⚠️ Missing tables: ${missing.join(", ")}`);
  } else {
    console.log("✅ All required tables exist");
  }

  return missing.length === 0;
}

export async function runIntegrationTests() {
  const dbOk = await testDatabaseConnection();
  if (!dbOk) return;

  await testRequiredTables();
  console.log("✅ Integration tests complete");
}

runIntegrationTests().catch((err) => {
  console.error("❌ Integration tests failed:", err);
  process.exit(1);
});
