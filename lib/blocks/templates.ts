import { Template } from "@/types/blocks";

export const STARTER_TEMPLATES: Template[] = [
  {
    id: "story",
    name: "Story",
    description: "Narrative article with hero image and quotes",
    sections: [
      { id: "story-title", type: "title", label: "Article Title", state: "required", maxCount: 1 },
      { id: "story-hero", type: "hero", label: "Hero Image", state: "required", maxCount: 1 },
      { id: "story-body", type: "body", label: "Main Content", state: "required", maxCount: 99 },
      { id: "story-quote", type: "quote", label: "Pull Quote", state: "optional", maxCount: 5 },
      { id: "story-gallery", type: "gallery", label: "Photo Gallery", state: "optional", maxCount: 3 },
      { id: "story-image", type: "image", label: "Inline Image", state: "optional", maxCount: 10 },
    ],
    themeVariant: "minimal",
  },
  {
    id: "travel-guide",
    name: "Travel Guide",
    description: "Destination guide with quick facts",
    sections: [
      { id: "guide-title", type: "title", label: "Guide Title", state: "required", maxCount: 1 },
      { id: "guide-hero", type: "hero", label: "Hero Image", state: "required", maxCount: 1 },
      { id: "guide-quickfacts", type: "quickFacts", label: "Quick Facts", state: "required", maxCount: 1 },
      { id: "guide-body", type: "body", label: "Guide Content", state: "required", maxCount: 99 },
      { id: "guide-gallery", type: "gallery", label: "Photo Gallery", state: "optional", maxCount: 3 },
      { id: "guide-image", type: "image", label: "Inline Image", state: "optional", maxCount: 10 },
      { id: "guide-callout", type: "callout", label: "Travel Tip", state: "optional", maxCount: 10 },
    ],
    themeVariant: "travel",
  },
  {
    id: "review",
    name: "Review",
    description: "Product/hotel review with pros & cons",
    sections: [
      { id: "review-title", type: "title", label: "Review Title", state: "required", maxCount: 1 },
      { id: "review-hero", type: "hero", label: "Hero Image", state: "required", maxCount: 1 },
      { id: "review-proscons", type: "prosCons", label: "Pros & Cons", state: "required", maxCount: 1 },
      { id: "review-body", type: "body", label: "Review Content", state: "required", maxCount: 99 },
      { id: "review-verdict", type: "verdict", label: "Final Verdict", state: "required", maxCount: 1 },
      { id: "review-image", type: "image", label: "Inline Image", state: "optional", maxCount: 10 },
      { id: "review-quote", type: "quote", label: "Highlight Quote", state: "optional", maxCount: 5 },
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
