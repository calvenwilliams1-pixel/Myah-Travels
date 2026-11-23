"use client";

import React, { useState } from "react";

interface TagWithCount {
  id: number;
  name: string;
  slug: string;
  usageCount: number;
}

interface FeedFiltersProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedSort: string;
  onSortChange: (sort: string) => void;
  availableTags: TagWithCount[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  /** One pill per template with published posts (type overhaul). */
  templateFilters: { id: string; name: string; count: number }[];
}

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
  availableTags,
  selectedTags,
  onTagsChange,
  templateFilters,
}: FeedFiltersProps) {
  const contentTypes = [
    { value: "all", label: "All" },
    ...templateFilters.map((t) => ({ value: t.id, label: t.name })),
  ];
  const [showAllTags, setShowAllTags] = useState(false);
  const topTags = availableTags.slice(0, 20);
  const visibleTags = showAllTags ? availableTags : topTags;
  const hasMoreTags = availableTags.length > 20;

  const toggleTag = (slug: string) => {
    if (selectedTags.includes(slug)) {
      onTagsChange(selectedTags.filter((s) => s !== slug));
    } else {
      onTagsChange([...selectedTags, slug]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {contentTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => onTypeChange(type.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === type.value
                ? "bg-primary text-white"
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

      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-gray-500 mr-1">Tags:</span>
          {visibleTags.map((tag) => {
            const isSelected = selectedTags.includes(tag.slug);
            return (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.slug)}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                #{tag.name}
              </button>
            );
          })}
          {hasMoreTags && (
            <button
              onClick={() => setShowAllTags((v) => !v)}
              className="text-xs text-primary hover:underline ml-1"
            >
              {showAllTags ? "Show fewer" : `Show all ${availableTags.length}`}
            </button>
          )}
          {selectedTags.length > 0 && (
            <button
              onClick={() => onTagsChange([])}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Clear tags
            </button>
          )}
        </div>
      )}

    </div>
  );
}
