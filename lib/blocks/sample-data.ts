import type { BlockData, BlockType } from "@/types/blocks";
import { serializeBodyContent } from "@/lib/editor/body-content";

/**
 * Sample content for the Template Manager's builder (Cal, 2026-11-24).
 *
 * A template is an arrangement, and an arrangement of empty blocks is
 * impossible to judge, so every block in the builder is filled with
 * sample words and sample photos and the live preview shows the post
 * the way a reader would see it. None of this is ever saved: a saved
 * template stores only the ordered block types, and a post started
 * from a template starts empty, as posts always have.
 */

export const PLACEHOLDER_BEACH = "/images/placeholders/beach.svg";
export const PLACEHOLDER_RESORT = "/images/placeholders/resort.svg";
export const PLACEHOLDER_FOOD = "/images/placeholders/food.svg";

const SAMPLE_BODY_DOC = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "We landed just after lunch and the heat hit us the second the doors opened. The drive to the resort took about forty minutes, long enough for the kids to spot three lizards and one very relaxed dog.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is sample writing, here so you can see what a paragraph looks like in this spot. When you write the real post, your own words go here and the samples stay behind in the template builder.",
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "By the second day we had a routine: breakfast early, beach before it got too hot, and a nap nobody admitted to taking.",
        },
      ],
    },
  ],
};

export function getSampleBlockData(type: BlockType): BlockData {
  const id = crypto.randomUUID();
  switch (type) {
    case "title":
      return { id, type, data: { text: "Two weeks in Punta Cana", level: 2 } };
    case "body":
      return {
        id,
        type,
        data: { tiptapJson: serializeBodyContent(JSON.stringify(SAMPLE_BODY_DOC)) },
      };
    case "hero":
      return {
        id,
        type,
        data: {
          imageUrl: PLACEHOLDER_BEACH,
          alt: "Sample photo of a beach",
          caption: "A sample photo. Yours will go here.",
          size: "large",
        },
      };
    case "image":
      return {
        id,
        type,
        data: {
          imageUrl: PLACEHOLDER_FOOD,
          alt: "Sample photo of a local dish",
          caption: "Sample caption. The real one is yours to write.",
        },
      };
    case "gallery":
      return {
        id,
        type,
        data: {
          images: [
            { url: PLACEHOLDER_BEACH, caption: "The beach" },
            { url: PLACEHOLDER_RESORT, caption: "The pool" },
            { url: PLACEHOLDER_FOOD, caption: "Dinner, first night" },
          ],
          style: "grid",
          columns: 3,
        },
      };
    case "quickFacts":
      return {
        id,
        type,
        data: {
          facts: [
            { label: "Best time to go", value: "November to April" },
            { label: "Flight time", value: "About 4 hours from Toronto" },
            { label: "Good to know", value: "Reef-safe sunscreen only" },
          ],
        },
      };
    case "quote":
      return {
        id,
        type,
        data: {
          text: "The kids are still talking about the catamaran day.",
          author: "A past traveller",
        },
      };
    case "prosCons":
      return {
        id,
        type,
        data: {
          pros: ["Right on the beach", "Kids club included", "Breakfast was better than expected"],
          cons: ["Rooms are a walk from the lobby", "Excursions fill up fast"],
        },
      };
    case "verdict":
      return {
        id,
        type,
        data: {
          text: "Worth it for families who want everything in one place and the planning done for them.",
          rating: 4,
        },
      };
    case "callout":
      return {
        id,
        type,
        data: {
          variant: "tip",
          text: "Sample tip: pack a light sweater for the plane. The air conditioning is no joke.",
        },
      };
  }
}

/** A short plain summary of a sample block, for the builder's list rows. */
export function summarizeSampleBlock(block: BlockData): string {
  switch (block.type) {
    case "title":
      return block.data.text;
    case "body":
      return "Sample paragraphs, so you can see the spacing and length.";
    case "hero":
    case "image":
      return block.data.caption || block.data.alt;
    case "gallery":
      return `${block.data.images.length} sample photos in a row.`;
    case "quickFacts":
      return block.data.facts.map((f) => f.label).join(" · ");
    case "quote":
      return block.data.text;
    case "prosCons":
      return `${block.data.pros.length} good points, ${block.data.cons.length} things to know.`;
    case "verdict":
      return block.data.text;
    case "callout":
      return block.data.text;
  }
}
