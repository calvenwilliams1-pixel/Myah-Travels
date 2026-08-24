import React from "react";
import FeedCard from "./FeedCard";

interface FeedItem {
  id: number;
  type: "post" | "guide" | "review";
  title: string;
  excerpt: string;
  featuredImage?: string | null;
  slug: string;
  publishedAt: string;
  isPinned?: boolean;
  isHighlighted?: boolean;
  category?: string;
}

interface FeedContainerProps {
  items: FeedItem[];
}

export default function FeedContainer({ items }: FeedContainerProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl mb-2">📝</p>
        <p className="text-gray-500">No content yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedCard
          key={`${item.type}-${item.id}`}
          id={item.id}
          type={item.type}
          title={item.title}
          excerpt={item.excerpt}
          featuredImage={item.featuredImage}
          slug={item.slug}
          publishedAt={item.publishedAt}
          isPinned={item.isPinned}
          isHighlighted={item.isHighlighted}
          category={item.category}
        />
      ))}
    </div>
  );
}
