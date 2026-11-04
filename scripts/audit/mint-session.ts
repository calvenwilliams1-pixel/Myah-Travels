/**
 * Test helper: mint a portal session for use by bash audit scripts.
 * Usage: npx tsx scripts/audit/mint-session.ts <portalId> <memberId>
 * Output: JSON { token, sessionId, portalSlug }
 */
import { generateMagicLink, consumeMagicLink, getPortalById } from "@/lib/portal";

async function main() {
  const portalId = parseInt(process.argv[2], 10);
  const memberId = parseInt(process.argv[3], 10);

  if (isNaN(portalId) || isNaN(memberId)) {
    console.error("Usage: mint-session.ts <portalId> <memberId>");
    process.exit(1);
  }

  const portal = await getPortalById(portalId);
  if (!portal) {
    console.error(`Portal ${portalId} not found`);
    process.exit(1);
  }

  const token = await generateMagicLink(portalId, memberId);
  if (!token) {
    console.error("Token generation failed");
    process.exit(1);
  }

  const result = await consumeMagicLink(token);
  if (!result) {
    console.error("Token consumption failed");
    process.exit(1);
  }

  console.log(JSON.stringify({
    token,
    sessionId: result.sessionId,
    portalId: result.portalId,
    portalSlug: portal.slug,
  }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
