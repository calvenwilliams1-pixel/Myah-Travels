// CLI: run the portal purge job. In production this should run daily
// via cron. In dev, run manually:
//
//   npx tsx scripts/purge-portals.ts          # purge eligible portals
//   npx tsx scripts/purge-portals.ts --dry    # preview only
//
// Dry run shows what would be purged without touching the DB.

import { runPortalPurge, previewPurge } from "../lib/jobs/portal-purge";

async function run() {
  const isDry = process.argv.includes("--dry");

  if (isDry) {
    console.log("Portal purge — DRY RUN");
    const eligible = await previewPurge();
    if (eligible.length === 0) {
      console.log("  No portals are eligible for purge.");
    } else {
      console.log("  " + eligible.length + " portal(s) would be purged:");
      for (const p of eligible) {
        console.log("    - " + p.name + " (id " + p.id + ", return " + (p.returnDate || "n/a") + ", keep_until " + (p.keepUntil || "n/a") + ", purge date " + p.purgeDate + ")");
      }
    }
    process.exit(0);
  }

  console.log("Portal purge — LIVE");
  const result = await runPortalPurge();
  console.log("  Purged portals: " + result.purged);
  console.log("  Itineraries kept (detached + archived): " + result.keptItineraries);
  process.exit(0);
}

run().catch((err) => {
  console.error("purge-portals failed:", err);
  process.exit(1);
});
