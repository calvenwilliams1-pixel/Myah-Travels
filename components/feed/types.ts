export interface FeedTag {
  id: number;
  name: string;
  slug: string;
}

export interface FeedItem {
  id: number;
  /** Always "post" since the type overhaul — the template is the type. */
  type: "post";
  templateId: string | null;
  templateName: string | null;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  slug: string;
  publishedAt: string;
  isPinned: boolean;
  isHighlighted: boolean;
  category: string | null;
  tags: FeedTag[];
}

export interface FeedTemplateFilter {
  id: string;
  name: string;
  count: number;
}
