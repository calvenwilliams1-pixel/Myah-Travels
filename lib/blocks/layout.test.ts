import { describe, it, expect } from "vitest";
import { sectionsFromLayout, isValidLayout, isLayoutTemplate } from "./layout";
import type { Template } from "@/types/blocks";

describe("isLayoutTemplate", () => {
  const base: Template = {
    id: "x",
    name: "X",
    description: "",
    themeVariant: "minimal",
    sections: [],
  };

  it("is true when the template carries a non-empty layout", () => {
    expect(isLayoutTemplate({ ...base, layout: ["title", "body"] })).toBe(true);
  });

  it("is false for rules-only templates, empty layouts and nothing", () => {
    expect(isLayoutTemplate(base)).toBe(false);
    expect(isLayoutTemplate({ ...base, layout: [] })).toBe(false);
    expect(isLayoutTemplate(null)).toBe(false);
    expect(isLayoutTemplate(undefined)).toBe(false);
  });
});

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
