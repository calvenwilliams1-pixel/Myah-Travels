"use client";

import React, { useTransition } from "react";
import FeedFilters from "./FeedFilters";
import InfiniteFeed from "./InfiniteFeed";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedItem, FeedTemplateFilter } from "./types";

interface TagWithCount {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
}

interface FeedPageProps {
  initialItems: FeedItem[];
  initialType: string;
  initialSort: string;
  initialTags: string[];
  availableTags: TagWithCount[];
  templateFilters: FeedTemplateFilter[];
}

export default function FeedPage({
  initialItems,
  initialType,
  initialSort,
  initialTags,
  availableTags,
  templateFilters,
}: FeedPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL is the source of truth — server re-fetches on navigation.
  // initialType/initialSort come from the server render and match the URL.
  const selectedType = searchParams.get("type") ?? initialType;
  const selectedSort = searchParams.get("sort") ?? initialSort;
  const selectedTags = (searchParams.get("tags") ?? initialTags.join(","))
    .split(",")
    .filter(Boolean);

  const updateFilters = (updates: { type?: string; sort?: string; tags?: string[] }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.type !== undefined) {
      if (updates.type === "all") params.delete("type");
      else params.set("type", updates.type);
    }
    if (updates.sort !== undefined) {
      if (updates.sort === "pinned") params.delete("sort");
      else params.set("sort", updates.sort);
    }
    if (updates.tags !== undefined) {
      if (updates.tags.length === 0) params.delete("tags");
      else params.set("tags", updates.tags.join(","));
    }
    const queryString = params.toString();
    startTransition(() => {
      router.push(queryString ? `/?${queryString}` : "/", { scroll: false });
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <FeedFilters
        selectedType={selectedType}
        onTypeChange={(type) => updateFilters({ type })}
        selectedSort={selectedSort}
        onSortChange={(sort) => updateFilters({ sort })}
        availableTags={availableTags}
        selectedTags={selectedTags}
        onTagsChange={(tags) => updateFilters({ tags })}
        templateFilters={templateFilters}
      />

      <div className={`mt-6 ${isPending ? "opacity-50" : ""}`}>
        <InfiniteFeed
          key={`${selectedType}-${selectedSort}-${selectedTags.join(",")}`}
          initialItems={initialItems}
          selectedType={selectedType}
          selectedSort={selectedSort}
          selectedTags={selectedTags}
        />
      </div>
    </div>
  );
}
