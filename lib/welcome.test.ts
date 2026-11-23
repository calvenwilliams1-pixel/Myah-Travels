import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCanvasDocument } from "@/lib/canvas/parse";
import {
  canvasMatchesStarterShape,
  extractWelcomeContent,
  resolveWelcomeContent,
  summarizeCanvasContent,
} from "./welcome";

const starterJson = readFileSync(
  join(process.cwd(), "scripts", "starter-homepage-canvas.json"),
  "utf8"
);
const starterDoc = parseCanvasDocument(starterJson);

describe("canvasMatchesStarterShape", () => {
  it("matches the seeded starter", () => {
    expect(canvasMatchesStarterShape(starterDoc)).toBe(true);
  });

  it("still matches when only the words and photo were edited", () => {
    const edited = JSON.parse(starterJson);
    edited.elements[0].src = "/api/uploads/my-photo.jpg";
    edited.elements[1].text = "My new headline";
    edited.elements[2].text = "My new words.";
    expect(canvasMatchesStarterShape(parseCanvasDocument(JSON.stringify(edited)))).toBe(true);
  });

  it("does not match when an element was added", () => {
    const edited = JSON.parse(starterJson);
    edited.elements.push({ ...edited.elements[1], id: "extra01" });
    expect(canvasMatchesStarterShape(parseCanvasDocument(JSON.stringify(edited)))).toBe(false);
  });

  it("does not match when an element was removed", () => {
    const edited = JSON.parse(starterJson);
    edited.elements = edited.elements.slice(0, 3);
    expect(canvasMatchesStarterShape(parseCanvasDocument(JSON.stringify(edited)))).toBe(false);
  });

  it("does not match null or garbage", () => {
    expect(canvasMatchesStarterShape(null)).toBe(false);
    expect(canvasMatchesStarterShape(parseCanvasDocument("not json"))).toBe(false);
  });
});

describe("extractWelcomeContent", () => {
  it("pulls photo, heading, text and button from the starter", () => {
    const content = extractWelcomeContent(starterDoc!);
    expect(content.photo).toBe("/images/welcome-banner.jpg");
    expect(content.heading).toBe("Welcome to MyCalTravels");
    expect(content.text).toContain("I'm Myah");
    expect(content.buttonLabel).toBe("Plan a trip with me");
    expect(content.buttonHref).toBe("/contact");
  });
});

describe("resolveWelcomeContent", () => {
  it("stored content wins over the canvas", () => {
    const stored = JSON.stringify({ heading: "Saved heading", photo: "/x.jpg" });
    const { content, source } = resolveWelcomeContent(stored, starterJson);
    expect(source).toBe("stored");
    expect(content.heading).toBe("Saved heading");
    expect(content.text).toBe("");
  });

  it("carries over from a shape-matching canvas", () => {
    const { content, source } = resolveWelcomeContent(null, starterJson);
    expect(source).toBe("canvas");
    expect(content.heading).toBe("Welcome to MyCalTravels");
  });

  it("starts blank when the canvas was reshaped", () => {
    const edited = JSON.parse(starterJson);
    edited.elements.push({ ...edited.elements[1], id: "extra01" });
    const { content, source } = resolveWelcomeContent(null, JSON.stringify(edited));
    expect(source).toBe("blank");
    expect(content.heading).toBe("");
  });

  it("starts blank with no canvas at all", () => {
    const { source } = resolveWelcomeContent(null, null);
    expect(source).toBe("blank");
  });
});

describe("summarizeCanvasContent", () => {
  it("lists the words and photo of a reshaped canvas for copy-paste", () => {
    const edited = JSON.parse(starterJson);
    edited.elements[1].text = "A headline she wrote herself";
    const summary = summarizeCanvasContent(parseCanvasDocument(JSON.stringify(edited)));
    expect(summary).toContain("A headline she wrote herself");
    expect(summary).toContain("Photo: /images/welcome-banner.jpg");
    expect(summary).toContain("Button: Plan a trip with me");
  });
});
