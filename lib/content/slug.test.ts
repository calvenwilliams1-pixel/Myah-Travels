import { describe, it, expect } from "vitest";
import { generateSlug } from "./index";

describe("generateSlug", () => {
  it("strips apostrophes", () => {
    expect(generateSlug("Disney's Guide")).toBe("disneys-guide");
  });

  it("strips colons", () => {
    expect(generateSlug("Tokyo: Day 1")).toBe("tokyo-day-1");
  });

  it("collapses multiple spaces to one hyphen", () => {
    expect(generateSlug("Hello    World")).toBe("hello-world");
  });

  it("collapses repeated hyphens", () => {
    expect(generateSlug("Hello -- World")).toBe("hello-world");
  });

  it("preserves numbers", () => {
    expect(generateSlug("Part 2 Tokyo")).toBe("part-2-tokyo");
  });

  it("returns empty for emoji-only title", () => {
    expect(generateSlug("🔥🔥🔥")).toBe("");
  });

  it("returns empty for whitespace-only title", () => {
    expect(generateSlug("   ")).toBe("");
  });

  it("returns empty for punctuation-only title", () => {
    expect(generateSlug("!!!???")).toBe("");
  });

  it("lowercases", () => {
    expect(generateSlug("TOKYO")).toBe("tokyo");
  });

  it("trims leading and trailing whitespace", () => {
    expect(generateSlug("  tokyo  ")).toBe("tokyo");
  });

  it("rejects japanese characters (documented — see note)", () => {
    // Japanese titles slug to empty. If Myah writes a Japanese-only title,
    // the action rejects it with a clear error. Future: allow custom slug input.
    expect(generateSlug("東京")).toBe("");
  });
});
