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
