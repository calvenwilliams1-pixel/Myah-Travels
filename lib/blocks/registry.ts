import { BlockType, BlockData } from "@/types/blocks";

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  description: string;
  getDefaultData: () => BlockData;
}

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinition> = {
  title: {
    type: "title",
    label: "Title",
    icon: "📝",
    description: "Section heading",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "title",
      data: { text: "", level: 2 },
    }),
  },
  body: {
    type: "body",
    label: "Body",
    icon: "📄",
    description: "Rich text content",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "body",
      data: { tiptapJson: "" },
    }),
  },
  hero: {
    type: "hero",
    label: "Hero Image",
    icon: "🖼️",
    description: "Large featured image",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "hero",
      data: { imageUrl: "", alt: "" },
    }),
  },
  gallery: {
    type: "gallery",
    label: "Gallery",
    icon: "📸",
    description: "Multiple images",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "gallery",
      data: { images: [] },
    }),
  },
  quickFacts: {
    type: "quickFacts",
    label: "Quick Facts",
    icon: "⚡",
    description: "Label/value pairs",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "quickFacts",
      data: { facts: [] },
    }),
  },
  quote: {
    type: "quote",
    label: "Quote",
    icon: "💬",
    description: "Quotation with attribution",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "quote",
      data: { text: "", author: "" },
    }),
  },
  prosCons: {
    type: "prosCons",
    label: "Pros & Cons",
    icon: "⚖️",
    description: "Two-column comparison",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "prosCons",
      data: { pros: [], cons: [] },
    }),
  },
  verdict: {
    type: "verdict",
    label: "Verdict",
    icon: "⭐",
    description: "Final conclusion with rating",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "verdict",
      data: { text: "" },
    }),
  },
  callout: {
    type: "callout",
    label: "Callout",
    icon: "📢",
    description: "Highlight tip, warning, or info",
    getDefaultData: () => ({
      id: crypto.randomUUID(),
      type: "callout",
      data: { variant: "tip", text: "" },
    }),
  },
};

export function getBlockDefinition(type: BlockType): BlockDefinition {
  return BLOCK_REGISTRY[type];
}

export function getAllBlockDefinitions(): BlockDefinition[] {
  return Object.values(BLOCK_REGISTRY);
}
