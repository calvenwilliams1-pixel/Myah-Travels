import { Template } from "@/types/blocks";

export const STARTER_TEMPLATES: Template[] = [
  {
    id: "story",
    name: "Story",
    description: "Narrative article with hero image and quotes",
    sections: [
      { id: "story-title", type: "title", required: true, maxCount: 1 },
      { id: "story-hero", type: "hero", required: true, maxCount: 1 },
      { id: "story-body", type: "body", required: true, maxCount: 99 },
      { id: "story-quote", type: "quote", required: false, maxCount: 5 },
      { id: "story-gallery", type: "gallery", required: false, maxCount: 3 },
    ],
    themeVariant: "minimal",
  },
  {
    id: "travel-guide",
    name: "Travel Guide",
    description: "Destination guide with quick facts",
    sections: [
      { id: "guide-title", type: "title", required: true, maxCount: 1 },
      { id: "guide-hero", type: "hero", required: true, maxCount: 1 },
      { id: "guide-quickfacts", type: "quickFacts", required: true, maxCount: 1 },
      { id: "guide-body", type: "body", required: true, maxCount: 99 },
      { id: "guide-gallery", type: "gallery", required: false, maxCount: 3 },
    ],
    themeVariant: "travel",
  },
  {
    id: "review",
    name: "Review",
    description: "Product/hotel review with pros & cons",
    sections: [
      { id: "review-title", type: "title", required: true, maxCount: 1 },
      { id: "review-hero", type: "hero", required: true, maxCount: 1 },
      { id: "review-proscons", type: "prosCons", required: true, maxCount: 1 },
      { id: "review-body", type: "body", required: true, maxCount: 99 },
      { id: "review-verdict", type: "verdict", required: true, maxCount: 1 },
    ],
    themeVariant: "review",
  },
];

export function getTemplateById(id: string): Template | undefined {
  return STARTER_TEMPLATES.find((t) => t.id === id);
}

export function getAllTemplates(): Template[] {
  return STARTER_TEMPLATES;
}
