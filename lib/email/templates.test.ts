import { describe, it, expect } from "vitest";
import { magicLinkEmail } from "./templates";

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
