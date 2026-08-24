"use client";

import React, { useState, useEffect } from "react";
import FeedContainer from "./FeedContainer";
import FeedFilters from "./FeedFilters";
import { useSearchParams } from "next/navigation";

interface FeedPageProps {
  initialItems: any[];
  categories: string[];
}

export default function FeedPage({ initialItems, categories }: FeedPageProps) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initialItems);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedSort, setSelectedSort] = useState("newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type") || "all";
    const sort = searchParams.get("sort") || "newest";
    const category = searchParams.get("category") || "all";
    setSelectedType(type);
    setSelectedSort(sort);
    setSelectedCategory(category);
  }, [searchParams]);

  useEffect(() => {
    async function fetchItems() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("type", selectedType);
        params.set("sort", selectedSort);
        params.set("category", selectedCategory);
        params.set("limit", "50");
        params.set("offset", "0");

        const res = await fetch(`/api/feed?${params.toString()}`);
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        console.error("Failed to fetch feed:", err);
      }
      setIsLoading(false);
    }

    fetchItems();
  }, [selectedType, selectedSort, selectedCategory]);

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <FeedFilters
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <FeedContainer items={items} />
        )}
      </div>
    </div>
  );
}
