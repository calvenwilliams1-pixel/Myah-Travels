// CLI: send magic links for a portal using the real lib/portal functions.
// Usage: npx tsx scripts/send-magic-links.ts <portalSlug>
// Uses relative imports (matching scripts/seed.ts) so tsx resolves them
// without requiring @/ alias support in the runner.

import { getPortalBySlug, sendMagicLinkEmails } from "../lib/portal";

async function run() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/send-magic-links.ts <portalSlug>");
    process.exit(1);
  }

  const portal = await getPortalBySlug(slug);
  if (!portal) {
    console.error("Portal not found:", slug);
    process.exit(1);
  }

  console.log("Sending magic links for portal:", portal.name, "(id " + portal.id + ")");
  await sendMagicLinkEmails(portal.id);
  console.log("Done. Emails queued.");
  console.log("");
  console.log("To process the queue:");
  console.log("  curl -X POST -H \"Authorization: Bearer $CRON_SECRET\" \\");
  console.log("    http://localhost:3000/api/email/process-queue");
  console.log("(Requires the dev server running and CRON_SECRET set in .env.)");

  process.exit(0);
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
