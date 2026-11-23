import { describe, it, expect } from "vitest";
import { parsePromoDeals, MAX_PROMOS } from "./promos";

const good = {
  image: "https://ttand.imgix.net/banner.jpg",
  href: "https://www.dslaptravel.com/offers",
  title: "Save up to $700 per couple",
};

describe("parsePromoDeals", () => {
  it("parses a clean list", () => {
    expect(parsePromoDeals(JSON.stringify([good]))).toEqual([good]);
  });
  it("returns [] for empty, junk and non-arrays", () => {
    expect(parsePromoDeals(null)).toEqual([]);
    expect(parsePromoDeals("")).toEqual([]);
    expect(parsePromoDeals("not json")).toEqual([]);
    expect(parsePromoDeals("{}")).toEqual([]);
  });
  it("drops non-https and malformed entries, keeps the good ones", () => {
    const mixed = [
      good,
      { image: "http://insecure.example/x.jpg", href: "https://ok.example/", title: "x" },
      { image: "https://ok.example/x.jpg", href: "javascript:alert(1)", title: "x" },
      { image: 42, href: "https://ok.example/", title: "x" },
      null,
      "junk",
    ];
    expect(parsePromoDeals(JSON.stringify(mixed))).toEqual([good]);
  });
  it("caps the list and trims long titles", () => {
    const many = Array.from({ length: MAX_PROMOS + 3 }, (_, i) => ({
      ...good,
      title: `Deal ${i} ` + "x".repeat(200),
    }));
    const out = parsePromoDeals(JSON.stringify(many));
    expect(out).toHaveLength(MAX_PROMOS);
    expect(out[0].title.length).toBeLessThanOrEqual(140);
  });
});
