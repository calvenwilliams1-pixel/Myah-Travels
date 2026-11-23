import { describe, it, expect } from "vitest";
import { getMagicLinkExpiry } from "./index";

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
