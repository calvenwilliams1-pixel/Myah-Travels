import { describe, it, expect } from "vitest";
import { resolveWelcomeContent, parseWelcomeTemplateId, EMPTY_WELCOME } from "./welcome";

describe("resolveWelcomeContent", () => {
  it("returns the saved fields", () => {
    const stored = JSON.stringify({
      photo: "/images/welcome-banner.jpg",
      heading: "Welcome to MyCalTravels",
      text: "Trips planned with care.",
      buttonLabel: "Plan a trip with me",
      buttonHref: "/contact",
    });
    expect(resolveWelcomeContent(stored)).toEqual({
      photo: "/images/welcome-banner.jpg",
      heading: "Welcome to MyCalTravels",
      text: "Trips planned with care.",
      buttonLabel: "Plan a trip with me",
      buttonHref: "/contact",
    });
  });

  it("fills missing fields with blanks", () => {
    const content = resolveWelcomeContent(JSON.stringify({ heading: "Hi" }));
    expect(content.heading).toBe("Hi");
    expect(content.photo).toBe("");
    expect(content.buttonHref).toBe("");
  });

  it("returns blanks for nothing saved or garbage", () => {
    expect(resolveWelcomeContent(null)).toEqual(EMPTY_WELCOME);
    expect(resolveWelcomeContent("not json")).toEqual(EMPTY_WELCOME);
  });
});

describe("parseWelcomeTemplateId", () => {
  it("accepts the three layouts and defaults to banner", () => {
    expect(parseWelcomeTemplateId("overlay")).toBe("overlay");
    expect(parseWelcomeTemplateId("split")).toBe("split");
    expect(parseWelcomeTemplateId("banner")).toBe("banner");
    expect(parseWelcomeTemplateId("canvas")).toBe("banner");
    expect(parseWelcomeTemplateId(null)).toBe("banner");
  });
});
