import { describe, it, expect } from "vitest";
import { magicLinkEmail } from "./templates";
import { resolveInviteCopy } from "@/lib/wording/registry";

describe("magicLinkEmail expiry line", () => {
  it("names the expiry date when one is given", () => {
    const { html } = magicLinkEmail(
      "Sam",
      "Smith Family Trip",
      "https://example.com/portal/access/abc",
      "December 5, 2026"
    );
    expect(html).toContain("This link expires on December 5, 2026.");
  });

  it("wears the site's brand colour when one is passed", () => {
    const { html } = magicLinkEmail(
      "Sam",
      "Trip",
      "https://example.com/portal/access/abc",
      "December 5, 2026",
      "#0077B6"
    );
    expect(html).toContain("background-color: #0077B6");
    expect(html).not.toContain("background-color: #4a7c59");
  });

  it("falls back to the default brand colour for a missing or invalid one", () => {
    for (const bad of [undefined, null, "", "green", "#12345"]) {
      const { html } = magicLinkEmail(
        "Sam",
        "Trip",
        "https://example.com/portal/access/abc",
        "December 5, 2026",
        bad
      );
      expect(html).toContain("background-color: #4a7c59");
    }
  });

  it("says the link never expires when the label is null (promo portal)", () => {
    const { html, subject } = magicLinkEmail(
      null,
      "Explore Travel With Me",
      "https://example.com/portal/access/abc",
      null
    );
    expect(html).toContain("This link doesn't expire");
    expect(html).not.toContain("This link expires on");
    expect(subject).toBe("Your Explore Travel With Me Access Link");
  });
});

/**
 * The R1 render-match test. The identity values below are the
 * production settings table's values for the keys the email reads,
 * copied on 2026-11-24 (site_name, instagram_url, youtube_url,
 * primary_color). With registry defaults, the rendered email must
 * match the pre-R1 production email except the plan's five listed
 * day-one lines: the three em dashes removed, and the two rewritten
 * lines (none of which appear in this trip-portal render except the
 * body and expiry dashes).
 */
describe("magicLinkEmail render match against production identity", () => {
  const PROD = {
    siteName: "MyCalTravels",
    instagramUrl: "https://www.instagram.com/mycaltravels",
    youtubeUrl: "https://youtube.com/@mycaltravels",
    brand: "#4a7c59",
  };

  it("trip portal: everything matches except the deliberate line changes", () => {
    const { subject, html } = magicLinkEmail(
      "Sam",
      "Smith Family Trip",
      "https://example.com/portal/access/abc",
      "December 5, 2026",
      PROD.brand,
      { siteName: PROD.siteName, instagramUrl: PROD.instagramUrl, youtubeUrl: PROD.youtubeUrl }
    );
    expect(subject).toBe("Your Smith Family Trip Access Link");
    expect(html).toContain("Your portal is ready");
    expect(html).toContain("Hi Sam,");
    // Day-one change: the body dash became a period.
    expect(html).toContain(
      "You've been added to the <strong>Smith Family Trip</strong> portal. That's where your trip information, documents and updates live. Click below to step inside."
    );
    expect(html).toContain("Button not working? Copy this link into your browser:");
    expect(html).toContain(
      "This link expires on December 5, 2026. If you need a new link, contact Myah."
    );
    expect(html).toContain(
      `© ${new Date().getFullYear()} MyCalTravels. You're receiving this because Myah added you to a client portal.`
    );
    expect(html).toContain(PROD.instagramUrl);
    expect(html).toContain(PROD.youtubeUrl);
    // No em dash survives anywhere in the default invite email.
    expect(html).not.toContain("—");
  });

  it("promo portal: body and expiry match with their dashes removed", () => {
    const { html } = magicLinkEmail(
      "Sam",
      "Explore Travel With Me",
      "https://example.com/portal/access/abc",
      null,
      PROD.brand,
      { siteName: PROD.siteName, instagramUrl: PROD.instagramUrl, youtubeUrl: PROD.youtubeUrl }
    );
    expect(html).toContain(
      "You've been added to the <strong>Explore Travel With Me</strong> portal. That's where Myah shares sample itineraries, travel ideas and offers, just for you. Click below to step inside."
    );
    expect(html).toContain(
      "This link doesn't expire. Save it and come back any time. If you lose it, contact Myah for a new one."
    );
    expect(html).not.toContain("—");
  });
});

describe("magicLinkEmail wording overrides and safety", () => {
  it("renders an edited greeting and subject", () => {
    const copy = resolveInviteCopy({
      wording_invite_greeting: "Hello {name},",
      wording_invite_subject: "Your link for {portal}",
    });
    const { subject, html } = magicLinkEmail(
      "Sam",
      "Smith Family Trip",
      "https://example.com/portal/access/abc",
      "December 5, 2026",
      null,
      { copy }
    );
    expect(subject).toBe("Your link for Smith Family Trip");
    expect(html).toContain("Hello Sam,");
  });

  it("escapes markup in a portal name instead of rendering it", () => {
    const { html, subject } = magicLinkEmail(
      "Sam",
      "<script>alert(1)</script>",
      "https://example.com/portal/access/abc",
      "December 5, 2026"
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(subject).not.toContain("<script>");
  });

  it("strips CR/LF from the subject so a portal name cannot inject headers", () => {
    const { subject } = magicLinkEmail(
      "Sam",
      "Trip\r\nBcc: attacker@example.com",
      "https://example.com/portal/access/abc",
      "December 5, 2026"
    );
    expect(subject).not.toContain("\n");
    expect(subject).not.toContain("\r");
  });

  it("hides a social link whose Settings URL is empty", () => {
    const { html } = magicLinkEmail(
      "Sam",
      "Trip",
      "https://example.com/portal/access/abc",
      "December 5, 2026",
      null,
      { instagramUrl: "", youtubeUrl: "https://youtube.com/@mycaltravels" }
    );
    expect(html).not.toContain("Instagram");
    expect(html).toContain("YouTube");
  });

  it("omits the Follow along line when both social URLs are empty", () => {
    const { html } = magicLinkEmail(
      "Sam",
      "Trip",
      "https://example.com/portal/access/abc",
      "December 5, 2026",
      null,
      { instagramUrl: "", youtubeUrl: "" }
    );
    expect(html).not.toContain("Follow along:");
  });
});
