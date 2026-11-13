"use client";

import React, { useState, useRef, useEffect } from "react";

interface TagInputProps {
  selectedTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  /**
   * Optional local suggestion source. When provided, filters this array
   * client-side instead of calling /api/tags/suggest (post-tag endpoint).
   * Notepad uses this to suggest portal member names + distinct notepad tags.
   */
  autocompleteSource?: string[];
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
  autocompleteSource,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    setHighlightIndex(0);
  }, [suggestions]);

  // Close the dropdown when the user clicks outside this component.
  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  useEffect(() => {
    // Do not auto-open the dropdown on mount. Only fetch/show suggestions
    // after the user has actually focused or clicked the input.
    if (!hasInteractedRef.current && input.trim() === "") {
      return;
    }

    // Local filter path — used by notepad (member names + distinct tags).
    // Empty input -> hide suggestions (local mode has no "favourites" concept).
    if (autocompleteSource) {
      if (input.trim() === "") {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      const q = input.trim().toLowerCase();
      const already = new Set(selectedTags.map((t) => t.toLowerCase()));
      const matches = autocompleteSource
        .filter((s) => s.toLowerCase().includes(q) && !already.has(s.toLowerCase()))
        .slice(0, 8);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      return;
    }

    // API path — used by post tag editor.
    // Empty input -> fetch favourites so the dropdown is useful on focus.
    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/tags/suggest?q=${encodeURIComponent(input)}`);
        const data = await res.json();
        setSuggestions(data.tags || []);
        setShowSuggestions((data.tags || []).length > 0);
      } catch {
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(fetchSuggestions, input.trim() === "" ? 0 : 200);
    return () => clearTimeout(timeout);
  }, [input, autocompleteSource, selectedTags]);

  const openSuggestions = async () => {
    hasInteractedRef.current = true;
    // Called on focus/click — populate with favourites if the input is empty.
    if (input.trim() !== "") return;  // typed content is handled by useEffect
    if (autocompleteSource) return;   // local mode handles its own lifecycle
    try {
      const res = await fetch(`/api/tags/suggest?q=`);
      const data = await res.json();
      const tags = data.tags || [];
      if (tags.length > 0) {
        setSuggestions(tags);
        setShowSuggestions(true);
      }
    } catch {
      // silent — suggestions are optional
    }
  };

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
    <div ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
          >
            #{tag}
            <button
              onClick={() => onRemoveTag(tag)}
              className="text-primary hover:text-primary-dark"
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
          onFocus={() => { void openSuggestions(); }}
          onClick={() => { void openSuggestions(); }}
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

        {showSuggestions && hasInteractedRef.current && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {suggestions.map((tag, i) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className={`w-full text-left px-3 py-2 text-sm ${
                  i === highlightIndex ? "bg-primary/10" : "hover:bg-primary/10"
                }`}
              >
                #{tag}
              </button>
            ))}
            {input.trim() !== "" && (
              <button
                onClick={() => handleAddTag(input)}
                className="w-full text-left px-3 py-2 text-sm text-primary border-t border-gray-100"
              >
                Create new tag: #{input}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
