// ============================================
// CONTENT BLOCK SYSTEM TYPES (Phase 1)
// ============================================

export type BlockType =
  | "title"
  | "body"
  | "hero"
  | "gallery"
  | "quickFacts"
  | "quote"
  | "prosCons"
  | "verdict"
  | "callout";

export interface TitleData {
  text: string;
  level: 1 | 2 | 3;
}

export interface BodyData {
  tiptapJson: string;
}

export interface HeroData {
  imageUrl: string;
  alt: string;
  caption?: string;
}

export interface GalleryData {
  images: { url: string; caption: string }[];
}

export interface QuickFactsData {
  facts: { label: string; value: string }[];
}

export interface QuoteData {
  text: string;
  author: string;
}

export interface ProsConsData {
  pros: string[];
  cons: string[];
}

export interface VerdictData {
  text: string;
  rating?: number;
}

export interface CalloutData {
  variant: "tip" | "warning" | "info";
  text: string;
}

export type BlockData =
  | { id: string; type: "title"; data: TitleData }
  | { id: string; type: "body"; data: BodyData }
  | { id: string; type: "hero"; data: HeroData }
  | { id: string; type: "gallery"; data: GalleryData }
  | { id: string; type: "quickFacts"; data: QuickFactsData }
  | { id: string; type: "quote"; data: QuoteData }
  | { id: string; type: "prosCons"; data: ProsConsData }
  | { id: string; type: "verdict"; data: VerdictData }
  | { id: string; type: "callout"; data: CalloutData };

export interface TemplateSection {
  id: string;
  type: BlockType;
  required: boolean;
  maxCount: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  sections: TemplateSection[];
  themeVariant?: "minimal" | "travel" | "review";
}

export interface BlockPost {
  id: string;
  templateId: string;
  title: string;
  status: "draft" | "published";
  content: BlockData[];
  createdAt: string;
  updatedAt: string;
}
