"use client";

import React, { useState, useRef, useEffect } from "react";

interface TagInputProps {
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
}

function normaliseForCompare(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^#/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export default function TagInput({
  selectedTags,
  onAddTag,
  onRemoveTag,
  placeholder = "Add tags...",
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHighlightIndex(0);
  }, [suggestions]);

  useEffect(() => {
    if (input.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/tags/suggest?q=${encodeURIComponent(input)}`);
        const data = await res.json();
        setSuggestions(data.tags || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(timeout);
  }, [input]);

  const handleAddTag = (tag: string) => {
    const slug = normaliseForCompare(tag);
    if (slug && !selectedTags.some((t) => normaliseForCompare(t) === slug)) {
      onAddTag(tag.trim());
    }
    setInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs"
          >
            #{tag}
            <button
              onClick={() => onRemoveTag(tag)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightIndex((prev) =>
                prev >= suggestions.length - 1 ? 0 : prev + 1
              );
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightIndex((prev) =>
                prev <= 0 ? suggestions.length - 1 : prev - 1
              );
            }
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions[highlightIndex]) {
                handleAddTag(suggestions[highlightIndex]);
              } else if (input.trim()) {
                handleAddTag(input);
              }
            }
            if (e.key === "Backspace" && input === "" && selectedTags.length > 0) {
              onRemoveTag(selectedTags[selectedTags.length - 1]);
            }
            if (e.key === "Escape") {
              setShowSuggestions(false);
              setHighlightIndex(0);
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />

        {showSuggestions && input.trim() !== "" && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((tag, i) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  i === highlightIndex ? "bg-emerald-100" : "hover:bg-emerald-50"
                }`}
              >
                #{tag}
              </button>
            ))}
            <button
              onClick={() => handleAddTag(input)}
              className="w-full text-left px-3 py-2 text-sm text-emerald-700 border-t border-gray-100"
            >
              Create new tag: #{input}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
