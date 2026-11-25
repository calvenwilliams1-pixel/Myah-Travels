import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  getSampleBlockData,
  summarizeSampleBlock,
  PLACEHOLDER_BEACH,
  PLACEHOLDER_RESORT,
  PLACEHOLDER_FOOD,
} from "./sample-data";
import { deserializeBodyContent } from "@/lib/editor/body-content";
import type { BlockType } from "@/types/blocks";

const ALL_TYPES: BlockType[] = [
  "title",
  "body",
  "hero",
  "image",
  "gallery",
  "quickFacts",
  "quote",
  "prosCons",
  "verdict",
  "callout",
];

describe("getSampleBlockData", () => {
  it("returns a filled block for every block type", () => {
    for (const type of ALL_TYPES) {
      const block = getSampleBlockData(type);
      expect(block.type).toBe(type);
      expect(block.id).toBeTruthy();
      expect(summarizeSampleBlock(block).length).toBeGreaterThan(0);
    }
  });

  it("fills text blocks with real sample words, not blanks", () => {
    const title = getSampleBlockData("title");
    if (title.type !== "title") throw new Error("type");
    expect(title.data.text.length).toBeGreaterThan(0);

    const quote = getSampleBlockData("quote");
    if (quote.type !== "quote") throw new Error("type");
    expect(quote.data.text.length).toBeGreaterThan(0);

    const facts = getSampleBlockData("quickFacts");
    if (facts.type !== "quickFacts") throw new Error("type");
    expect(facts.data.facts.length).toBeGreaterThanOrEqual(3);
  });

  it("gives the body sample content that deserializes to paragraphs", () => {
    const body = getSampleBlockData("body");
    if (body.type !== "body") throw new Error("type");
    const doc = deserializeBodyContent(body.data.tiptapJson) as {
      type: string;
      content: unknown[];
    };
    expect(doc.type).toBe("doc");
    expect(doc.content.length).toBeGreaterThanOrEqual(2);
  });

  it("points image blocks at the bundled placeholder photos", () => {
    const hero = getSampleBlockData("hero");
    if (hero.type !== "hero") throw new Error("type");
    expect(hero.data.imageUrl).toBe(PLACEHOLDER_BEACH);

    const gallery = getSampleBlockData("gallery");
    if (gallery.type !== "gallery") throw new Error("type");
    expect(gallery.data.images.map((i) => i.url)).toEqual([
      PLACEHOLDER_BEACH,
      PLACEHOLDER_RESORT,
      PLACEHOLDER_FOOD,
    ]);

    for (const p of [PLACEHOLDER_BEACH, PLACEHOLDER_RESORT, PLACEHOLDER_FOOD]) {
      expect(p.startsWith("/images/placeholders/")).toBe(true);
      expect(existsSync(join(process.cwd(), "public", p))).toBe(true);
    }
  });
});
