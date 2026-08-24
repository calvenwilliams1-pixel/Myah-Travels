import React from "react";
import Link from "next/link";

interface FeedCardProps {
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

export default function FeedCard({
  id,
  type,
  title,
  excerpt,
  featuredImage,
  slug,
  publishedAt,
  isPinned = false,
  isHighlighted = false,
  category,
}: FeedCardProps) {
  const typeLabels = {
    post: "Post",
    guide: "Guide",
    review: "Review",
  };

  const typeColors = {
    post: "bg-blue-100 text-blue-700",
    guide: "bg-emerald-100 text-emerald-700",
    review: "bg-amber-100 text-amber-700",
  };

  const href =
    type === "post"
      ? `/blog/${slug}`
      : type === "guide"
      ? `/guides/${slug}`
      : `/reviews/${slug}`;

  return (
    <article
      className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
        isHighlighted ? "border-emerald-400 ring-2 ring-emerald-200" : "border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
        {isPinned && (
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            📌 Pinned
          </span>
        )}
        {isHighlighted && (
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            ⭐ Featured
          </span>
        )}
        <span className={`text-xs px-2 py-1 rounded-full ${typeColors[type]}`}>
          {typeLabels[type]}
        </span>
        {category && (
          <span className="text-xs text-gray-500">{category}</span>
        )}
        <span className="text-xs text-gray-400 ml-auto">
          {new Date(publishedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {featuredImage && (
        <Link href={href}>
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-64 object-cover"
            loading="lazy"
          />
        </Link>
      )}

      <div className="p-4">
        <Link href={href}>
          <h2 className="text-lg font-semibold text-gray-900 mb-2 hover:text-emerald-700 transition-colors">
            {title}
          </h2>
        </Link>
        {excerpt && (
          <p className="text-sm text-gray-600 line-clamp-3">{excerpt}</p>
        )}
      </div>
    </article>
  );
}
