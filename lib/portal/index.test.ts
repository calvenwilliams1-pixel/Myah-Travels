import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { portals } from "@/drizzle/schema/portals";
import { portalMembers } from "@/drizzle/schema/portal-members";
import { portalMagicLinks } from "@/drizzle/schema/portal-magic-links";
import { portalSessions } from "@/drizzle/schema/portal-sessions";
import {
  getMagicLinkExpiry,
  createPortal,
  addPortalMember,
  generateMagicLink,
  validateMagicLink,
  consumeMagicLink,
} from "./index";

describe("getMagicLinkExpiry", () => {
  it("promo portal links effectively never expire", () => {
    const expiry = getMagicLinkExpiry({ isPromo: true, returnDate: "2026-12-01" });
    const years = (expiry.getTime() - Date.now()) / (365.25 * 24 * 3600 * 1000);
    expect(years).toBeGreaterThan(50);
  });

  it("trip portals expire 3 days after the return date", () => {
    const expiry = getMagicLinkExpiry({ returnDate: "2026-12-10" });
    const returnEnd = new Date("2026-12-10T23:59:59");
    const days = (expiry.getTime() - returnEnd.getTime()) / (24 * 3600 * 1000);
    expect(days).toBe(3);
  });

  it("dateless trip portals fall back to 30 days", () => {
    const expiry = getMagicLinkExpiry({});
    const days = (expiry.getTime() - Date.now()) / (24 * 3600 * 1000);
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });
});

describe("magic link reuse", () => {
  let portalId: number | undefined;

  afterAll(async () => {
    if (portalId === undefined) return;
    await db.delete(portalSessions).where(eq(portalSessions.portalId, portalId));
    await db.delete(portalMagicLinks).where(eq(portalMagicLinks.portalId, portalId));
    await db.delete(portalMembers).where(eq(portalMembers.portalId, portalId));
    await db.delete(portals).where(eq(portals.id, portalId));
  });

  it("a link still works after it has been used once", async () => {
    const [portal] = await createPortal({
      name: `Reuse Test ${Date.now().toString(36)}`,
    });
    portalId = portal.id;
    const [member] = await addPortalMember(portal.id, `reuse-${Date.now()}@example.com`);
    const token = await generateMagicLink(portal.id, member.id);
    expect(token).toBeTruthy();

    expect(await validateMagicLink(token!)).not.toBeNull();
    const first = await consumeMagicLink(token!);
    expect(first).not.toBeNull();

    // The regression: re-opening the same email link (another
    // browser, a mail-app handoff) must not say "expired or invalid".
    expect(await validateMagicLink(token!)).not.toBeNull();
    const second = await consumeMagicLink(token!);
    expect(second).not.toBeNull();
    expect(second!.sessionId).not.toBe(first!.sessionId);
  });
});
