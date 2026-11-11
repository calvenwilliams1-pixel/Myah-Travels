export interface FeedTag {
  id: number;
  name: string;
  slug: string;
}

export interface FeedItem {
  id: number;
  type: "post" | "guide" | "review";
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
