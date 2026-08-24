"use client";

import React from "react";

interface FeedFiltersProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CONTENT_TYPES = [
  { value: "all", label: "All" },
  { value: "post", label: "Posts" },
  { value: "guide", label: "Guides" },
  { value: "review", label: "Reviews" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "pinned", label: "Pinned First" },
];

export default function FeedFilters({
  selectedType,
  onTypeChange,
  selectedSort,
  onSortChange,
  categories,
  selectedCategory,
  onCategoryChange,
}: FeedFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === type.value
                ? "bg-emerald-700 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {type.label}
          </button>
        ))}

        <div className="ml-auto">
          <select
            value={selectedSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === "all"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Topics
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-gray-800 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
