import { describe, it, expect } from "vitest";
import { sectionsFromLayout, isValidLayout } from "./layout";

describe("sectionsFromLayout", () => {
  it("groups duplicates in first-appearance order, all required", () => {
    const sections = sectionsFromLayout(["title", "hero", "body", "quote", "body"]);
    expect(sections.map((s) => s.type)).toEqual(["title", "hero", "body", "quote"]);
    expect(sections.find((s) => s.type === "body")?.maxCount).toBe(2);
    expect(sections.every((s) => s.state === "required")).toBe(true);
  });

  it("handles a single block", () => {
    const sections = sectionsFromLayout(["body"]);
    expect(sections).toHaveLength(1);
    expect(sections[0].maxCount).toBe(1);
  });
});

describe("isValidLayout", () => {
  it("accepts a clean layout", () => {
    expect(isValidLayout(["title", "body", "body"])).toBe(true);
  });

  it("rejects junk", () => {
    expect(isValidLayout([])).toBe(false);
    expect(isValidLayout(["title", "nope"])).toBe(false);
    expect(isValidLayout("title")).toBe(false);
    expect(isValidLayout(null)).toBe(false);
    expect(isValidLayout(Array(61).fill("body"))).toBe(false);
  });
});
