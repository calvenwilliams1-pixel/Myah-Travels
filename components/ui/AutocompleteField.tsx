"use client";

import React, { useEffect, useRef, useState } from "react";
import SaveIndicator from "@/components/admin/SaveIndicator";
import SuggestionDropdown, { type SuggestionItem } from "@/components/ui/SuggestionDropdown";
import { useAutosaveField } from "@/lib/hooks/useAutosaveField";
import { useSuggestions } from "@/lib/suggestions/useSuggestions";
import { logSuggestionEvent } from "@/lib/suggestions/telemetry";

// ============================================================
// AUTOCOMPLETE FIELD (Phase 7.8)
// Autosave-backed input with suggestion dropdown. Editor-side.
// ============================================================

interface AutocompleteFieldProps {
  label?: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  draftKey?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  fieldKey: string;
  entityKind?: string;
  onEntityAccept?: (payload: Record<string, string>) => void;
}

const DEBOUNCE_MS = 150;

export default function AutocompleteField({
  label,
  value,
  onSave,
  draftKey,
  helperText,
  disabled,
  placeholder,
  fieldKey,
  entityKind,
  onEntityAccept,
}: AutocompleteFieldProps) {
  // Kill switch: when disabled, render a plain input with no suggestions.
  const enabled = process.env.NEXT_PUBLIC_AUTOCOMPLETE_ENABLED !== "false";

  const field = useAutosaveField<string>({ value, onSave, draftKey });
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const { fetchSuggestions } = useSuggestions();

  const lastExternalValueRef = useRef(value);
  useEffect(() => {
    if (value !== lastExternalValueRef.current) {
      lastExternalValueRef.current = value;
      if (field.value !== value) field.setValue(value);
    }
  }, [value, field]);

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
    if (next.trim()) logSuggestionEvent(fieldKey, "typed_fresh", next);
    field.setValue(next);
    setIsOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => run(next), DEBOUNCE_MS);
  }

  function handleFocus() {
    setIsOpen(true);
    run(field.value);
  }

  function accept(item: SuggestionItem) {
    const finalValue =
      item.source === "static" && item.value.includes(" · ")
        ? item.value.split(" · ")[0]
        : item.value;
    field.setValue(finalValue);
    field.flush();
    if (item.payload && onEntityAccept) onEntityAccept(item.payload);
    logSuggestionEvent(fieldKey, "accepted", finalValue);
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
    if (e.key === "Enter") field.flush();
  }

  const inputId = label
    ? "ac-" + label.toLowerCase().replace(/\s+/g, "-")
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
          value={field.value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={() => field.flush()}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
        />
        {field.dirty && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <SaveIndicator state={field.saveState} showText={false} />
          </div>
        )}
        {enabled && isOpen && (
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
