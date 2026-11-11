"use client";

import React, { useTransition } from "react";
import FeedFilters from "./FeedFilters";
import InfiniteFeed from "./InfiniteFeed";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedItem } from "./types";

interface FeedPageProps {
  initialItems: FeedItem[];
  initialType: string;
  initialSort: string;
}

export default function FeedPage({
  initialItems,
  initialType,
  initialSort,
}: FeedPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL is the source of truth — server re-fetches on navigation.
  // initialType/initialSort come from the server render and match the URL.
  const selectedType = searchParams.get("type") ?? initialType;
  const selectedSort = searchParams.get("sort") ?? initialSort;

  const updateFilters = (updates: { type?: string; sort?: string }) => {
    const params = new URLSearchParams(searchParams.toString());
    if (updates.type !== undefined) {
      if (updates.type === "all") params.delete("type");
      else params.set("type", updates.type);
    }
    if (updates.sort !== undefined) {
      if (updates.sort === "pinned") params.delete("sort");
      else params.set("sort", updates.sort);
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
      />

      <div className={`mt-6 ${isPending ? "opacity-50" : ""}`}>
        <InfiniteFeed
          key={`${selectedType}-${selectedSort}`}
          initialItems={initialItems}
          selectedType={selectedType}
          selectedSort={selectedSort}
        />
      </div>
    </div>
  );
}
