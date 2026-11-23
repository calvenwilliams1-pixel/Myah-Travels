import React from "react";
import Link from "next/link";

interface FeedCardProps {
  id: number;
  type: "post";
  /** The post's template is its type (type overhaul, Nov 23, 2026). */
  templateId?: string | null;
  templateName?: string | null;
  title: string;
  excerpt: string;
  featuredImage?: string | null;
  slug: string;
  publishedAt: string;
  isPinned?: boolean;
  isHighlighted?: boolean;
  category?: string;
  tags?: { id: number; name: string; slug: string }[];
}

const MAX_VISIBLE_TAGS = 4;

export default function FeedCard({
  id,
  type,
  templateName,
  title,
  excerpt,
  featuredImage,
  slug,
  publishedAt,
  isPinned = false,
  isHighlighted = false,
  category,
  tags = [],
}: FeedCardProps) {
  const href = `/blog/${slug}`;
  const typeLabel = templateName ?? "Post";

  const displayDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = tags.length - visibleTags.length;

  return (
    <article
      className={`group bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg ${
        isHighlighted
          ? "border border-primary/40 ring-1 ring-primary/10"
          : "border border-gray-200"
      }`}
    >
      {/* Image frame — 16:9, real image or placeholder cover */}
      <Link href={href} className="block relative aspect-[16/9] overflow-hidden">
        {featuredImage ? (
          <img
            src={featuredImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <PlaceholderCover title={title} label={typeLabel} />
        )}
      </Link>

      {/* Metadata row */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2 flex-wrap">
        {isPinned && (
          <span className="text-[11px] font-medium bg-gray-900 text-white px-2 py-0.5 rounded-full tracking-wide">
            Pinned
          </span>
        )}
        {isHighlighted && (
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full tracking-wide"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-accent) 15%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            Featured
          </span>
        )}
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-100">
          {typeLabel}
        </span>
        {category && (
          <span className="text-[11px] text-gray-500 uppercase tracking-wider">
            {category}
          </span>
        )}
        {displayDate && (
          <span className="text-[11px] text-gray-500 ml-auto">{displayDate}</span>
        )}
      </div>

      {/* Title + excerpt */}
      <div className="px-5 pb-3">
        <Link href={href}>
          <h2 className="font-serif text-xl sm:text-2xl leading-snug text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h2>
        </Link>
        {excerpt && (
          <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
            {excerpt}
          </p>
        )}
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap items-center gap-1.5">
          {visibleTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?tags=${encodeURIComponent(tag.slug)}`}
              className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
          {overflowCount > 0 && (
            <span className="text-[11px] text-gray-500 ml-0.5">
              +{overflowCount}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

function PlaceholderCover({ title, label }: { title: string; label: string }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center p-8 relative"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-primary) 12%, white)",
      }}
    >
      {/* Soft diagonal accent */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `linear-gradient(135deg, transparent 40%, color-mix(in srgb, var(--color-primary) 25%, transparent) 100%)`,
        }}
        aria-hidden
      />
      <p
        className="relative font-serif text-2xl sm:text-3xl text-center leading-snug line-clamp-4"
        style={{
          color: "color-mix(in srgb, var(--color-primary) 85%, black)",
        }}
      >
        {title}
      </p>
      <span
        className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.2em] font-medium opacity-70"
        style={{ color: "var(--color-primary)" }}
      >
        {label}
      </span>
    </div>
  );
}
