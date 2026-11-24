import { describe, it, expect, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { portals } from "@/drizzle/schema/portals";
import { portalMembers } from "@/drizzle/schema/portal-members";
import { portalMagicLinks } from "@/drizzle/schema/portal-magic-links";
import { portalSessions } from "@/drizzle/schema/portal-sessions";
import {
  getMagicLinkExpiry,
  getPublicBaseUrl,
  createPortal,
  addPortalMember,
  generateMagicLink,
  validateMagicLink,
  consumeMagicLink,
  portalSessionCookieName,
  isPortalSessionCookieName,
  LEGACY_PORTAL_SESSION_COOKIE,
} from "./index";
import { addLibraryItem, softDeleteLibraryItem } from "@/lib/content-library";
import {
  attachLibraryItemToPortal,
  getPortalItems,
  getPortalItemsWithContent,
} from "@/lib/portal-items";
import { portalItems } from "@/drizzle/schema/portal-items";
import { contentLibrary } from "@/drizzle/schema/content-library";

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

describe("getPublicBaseUrl", () => {
  it("prefers SITE_URL so redirects never land on the internal origin", () => {
    expect(
      getPublicBaseUrl("http://localhost:3000/portal/consume/x", "https://example.ts.net/")
    ).toBe("https://example.ts.net");
  });

  it("falls back to the request origin when SITE_URL is unset", () => {
    expect(getPublicBaseUrl("http://localhost:3000/portal/consume/x", "")).toBe(
      "http://localhost:3000"
    );
    expect(getPublicBaseUrl("https://site.example/portal", null)).toBe(
      process.env.SITE_URL?.replace(/\/+$/, "") || "https://site.example"
    );
  });
});

describe("magic link reuse", () => {
  const portalIds: number[] = [];

  afterAll(async () => {
    for (const portalId of portalIds) {
      await db.delete(portalSessions).where(eq(portalSessions.portalId, portalId));
      await db.delete(portalMagicLinks).where(eq(portalMagicLinks.portalId, portalId));
      await db.delete(portalMembers).where(eq(portalMembers.portalId, portalId));
      await db.delete(portals).where(eq(portals.id, portalId));
    }
  });

  it("a link still works after it has been used once", async () => {
    const [portal] = await createPortal({
      name: `Reuse Test ${Date.now().toString(36)}`,
    });
    portalIds.push(portal.id);
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

  it("generating a new link revokes the member's earlier link, even a used one", async () => {
    const [portal] = await createPortal({
      name: `Resend Test ${Date.now().toString(36)}`,
    });
    portalIds.push(portal.id);
    const [member] = await addPortalMember(portal.id, `resend-${Date.now()}@example.com`);
    const first = await generateMagicLink(portal.id, member.id);
    expect(first).toBeTruthy();
    await consumeMagicLink(first!);
    expect(await validateMagicLink(first!)).not.toBeNull();

    const second = await generateMagicLink(portal.id, member.id);
    expect(second).toBeTruthy();
    expect(await validateMagicLink(first!)).toBeNull();
    expect(await validateMagicLink(second!)).not.toBeNull();
  });
});

describe("portal session cookies", () => {
  it("names cookies per portal and recognizes the legacy name", () => {
    expect(portalSessionCookieName(7)).toBe("portal_session_7");
    expect(isPortalSessionCookieName("portal_session_7")).toBe(true);
    expect(isPortalSessionCookieName(LEGACY_PORTAL_SESSION_COOKIE)).toBe(true);
    expect(isPortalSessionCookieName("portal_session")).toBe(true);
    expect(isPortalSessionCookieName("portal_session_x")).toBe(false);
    expect(isPortalSessionCookieName("session")).toBe(false);
  });
});

describe("library attachments on the wall", () => {
  let portalId: number | undefined;
  let libraryId: number | undefined;

  afterAll(async () => {
    if (portalId !== undefined) {
      await db.delete(portalItems).where(eq(portalItems.portalId, portalId));
      await db.delete(portals).where(eq(portals.id, portalId));
    }
    if (libraryId !== undefined) {
      await db.delete(contentLibrary).where(eq(contentLibrary.id, libraryId));
    }
  });

  it("attaching the same item twice keeps one card, and deleting the item marks it missing", async () => {
    const [portal] = await createPortal({
      name: `Attach Test ${Date.now().toString(36)}`,
    });
    portalId = portal.id;
    const [lib] = await addLibraryItem({
      title: "Attach Test Doc",
      type: "pdf",
      filePath: "library/attach-test.pdf",
    });
    libraryId = lib.id;

    await attachLibraryItemToPortal(portal.id, lib.id);
    await attachLibraryItemToPortal(portal.id, lib.id);
    const attached = (await getPortalItems(portal.id)).filter(
      (i) => i.contentLibraryId === lib.id
    );
    expect(attached.length).toBe(1);

    let resolved = await getPortalItemsWithContent(portal.id);
    expect(resolved.find((i) => i.contentLibraryId === lib.id)?.isMissing).toBe(false);

    await softDeleteLibraryItem(lib.id);
    resolved = await getPortalItemsWithContent(portal.id);
    const ghost = resolved.find((i) => i.contentLibraryId === lib.id);
    expect(ghost?.isMissing).toBe(true);
    expect(ghost?.resolvedFilePath).toBeNull();
  });
});
