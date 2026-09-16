"use client";

import React from "react";

export interface SuggestionItem {
  value: string;
  subtitle?: string;
  payload?: Record<string, string>;
  source: "entity" | "static" | "field_value";
}

interface SuggestionDropdownProps {
  suggestions: SuggestionItem[];
  highlightIndex: number;
  onHighlight: (idx: number) => void;
  onAccept: (item: SuggestionItem) => void;
}

export default function SuggestionDropdown({
  suggestions,
  highlightIndex,
  onHighlight,
  onAccept,
}: SuggestionDropdownProps) {
  if (suggestions.length === 0) return null;
  return (
    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
      {suggestions.map((s, idx) => (
        <button
          key={s.value + ":" + idx}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onAccept(s);
          }}
          onMouseEnter={() => onHighlight(idx)}
          className={
            "w-full text-left px-3 py-2 text-sm flex items-start gap-2 " +
            (idx === highlightIndex ? "bg-primary/10" : "hover:bg-gray-50")
          }
        >
          <span className="text-xs text-gray-400 mt-0.5 w-10 shrink-0">
            {s.source === "entity" ? "★" : s.source === "static" ? "◆" : "○"}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block truncate">{s.value}</span>
            {s.subtitle && (
              <span className="block text-xs text-gray-500 truncate">{s.subtitle}</span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
