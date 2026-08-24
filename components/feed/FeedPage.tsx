"use client";

import React, { useState, useEffect } from "react";
import FeedFilters from "./FeedFilters";
import InfiniteFeed from "./InfiniteFeed";
import { useRouter, useSearchParams } from "next/navigation";
import { FeedItem } from "./types";

interface FeedPageProps {
  initialItems: FeedItem[];
  categories: string[];
}

export default function FeedPage({ initialItems, categories }: FeedPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedType, setSelectedType] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    setSelectedType(searchParams.get("type") || "all");
    setSelectedSort(searchParams.get("sort") || "newest");
    setSelectedCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  const updateFilters = (updates: { type?: string; sort?: string; category?: string }) => {
    const newType = updates.type ?? selectedType;
    const newSort = updates.sort ?? selectedSort;
    const newCategory = updates.category ?? selectedCategory;

    setSelectedType(newType);
    setSelectedSort(newSort);
    setSelectedCategory(newCategory);

    const params = new URLSearchParams();
    if (newType !== "all") params.set("type", newType);
    if (newSort !== "newest") params.set("sort", newSort);
    if (newCategory !== "all") params.set("category", newCategory);

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "/", { scroll: false });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <FeedFilters
        selectedType={selectedType}
        onTypeChange={(type) => updateFilters({ type })}
        selectedSort={selectedSort}
        onSortChange={(sort) => updateFilters({ sort })}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={(category) => updateFilters({ category })}
      />

      <div className="mt-6">
        <InfiniteFeed
          initialItems={initialItems}
          selectedType={selectedType}
          selectedSort={selectedSort}
          selectedCategory={selectedCategory}
        />
      </div>
    </div>
  );
}
