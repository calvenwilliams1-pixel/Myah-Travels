"use client";

import React, { useEffect, useRef, useState } from "react";
import SuggestionDropdown, { type SuggestionItem } from "@/components/ui/SuggestionDropdown";
import { useSuggestions } from "@/lib/suggestions/useSuggestions";

interface AutocompleteInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  fieldKey: string;
  entityKind?: string;
  onEntityAccept?: (payload: Record<string, string>) => void;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const DEBOUNCE_MS = 150;

export default function AutocompleteInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  disabled,
  fieldKey,
  entityKind,
  onEntityAccept,
  autoFocus,
  onKeyDown,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const { fetchSuggestions } = useSuggestions();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function run(query: string) {
    const items = await fetchSuggestions(fieldKey, query, entityKind);
    setSuggestions(items);
    setHighlightIndex(0);
  }

  function handleChange(next: string) {
    onChange(next);
    setIsOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => run(next), DEBOUNCE_MS);
  }

  function handleFocus() {
    setIsOpen(true);
    run(value);
  }

  function accept(item: SuggestionItem) {
    const finalValue =
      item.source === "static" && item.value.includes(" · ")
        ? item.value.split(" · ")[0]
        : item.value;
    onChange(finalValue);
    if (item.payload && onEntityAccept) onEntityAccept(item.payload);
    setIsOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isOpen && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        accept(suggestions[highlightIndex]);
        return;
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
    }
    if (onKeyDown) onKeyDown(e);
  }

  const inputId = label
    ? "ac-input-" + label.toLowerCase().replace(/\s+/g, "-")
    : undefined;

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
        />
        {isOpen && (
          <SuggestionDropdown
            suggestions={suggestions}
            highlightIndex={highlightIndex}
            onHighlight={setHighlightIndex}
            onAccept={accept}
          />
        )}
      </div>
      {helperText && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}
