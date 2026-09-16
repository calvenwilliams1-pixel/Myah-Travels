"use client";

import React, { useEffect, useRef, useState } from "react";
import SaveIndicator from "@/components/admin/SaveIndicator";
import { useAutosaveField } from "@/lib/hooks/useAutosaveField";

// ============================================================
// AUTOCOMPLETE FIELD (Phase 7.8)
// Text input with autosave + suggestion dropdown. Merges three
// sources: entities, statics (airports/airlines), field values.
// On accept of an entity, fires onEntityAccept so the parent form
// can hydrate sibling fields (address, defaults).
// ============================================================

export interface SuggestionItem {
  value: string;
  subtitle?: string;
  payload?: Record<string, string>;
  source: "entity" | "static" | "field_value";
}

interface AutocompleteFieldProps {
  label?: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  draftKey?: string;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Field key for field-value + statics lookups (e.g. "leg.origin"). */
  fieldKey: string;
  /** Entity kind for entity lookups (e.g. "hotel", "airline"). */
  entityKind?: string;
  /** Called when an entity with payload is accepted. */
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
  const field = useAutosaveField<string>({ value, onSave, draftKey });
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);
  const requestIdRef = useRef(0);

  const lastExternalValueRef = useRef(value);
  useEffect(() => {
    if (value !== lastExternalValueRef.current) {
      lastExternalValueRef.current = value;
      if (field.value !== value) field.setValue(value);
    }
  }, [value, field]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function fetchSuggestions(query: string) {
    const myId = ++requestIdRef.current;
    const q = query.trim();

    // Gather from three sources in parallel
    const tasks: Promise<SuggestionItem[]>[] = [];

    if (entityKind) {
      tasks.push(
        fetch("/api/suggestions/entities?kind=" + encodeURIComponent(entityKind) + "&q=" + encodeURIComponent(q))
          .then((r) => r.json())
          .then((d) =>
            (d.items || []).map((it: any) => ({
              value: it.canonicalName,
              subtitle: it.identity?.address || it.identity?.city || undefined,
              payload: { ...it.identity, ...(it.defaults || {}) },
              source: "entity" as const,
            }))
          )
          .catch(() => [])
      );
    }

    tasks.push(
      fetch("/api/suggestions/statics?field=" + encodeURIComponent(fieldKey) + "&q=" + encodeURIComponent(q))
        .then((r) => r.json())
        .then((d) =>
          (d.items || []).map((it: any) => ({
            value: it.iata ? it.iata + " · " + it.name : it.name,
            subtitle: it.city ? it.city + ", " + it.country : it.country,
            source: "static" as const,
          }))
        )
        .catch(() => [])
    );

    if (q) {
      tasks.push(
        fetch("/api/suggestions/field-values?field=" + encodeURIComponent(fieldKey) + "&q=" + encodeURIComponent(q))
          .then((r) => r.json())
          .then((d) =>
            (d.items || []).map((it: any) => ({
              value: it.value,
              source: "field_value" as const,
            }))
          )
          .catch(() => [])
      );
    }

    const results = await Promise.all(tasks);
    if (myId !== requestIdRef.current) return; // stale

    // Merge + dedupe by value. Entities rank first, then statics, then field values.
    const merged: SuggestionItem[] = [];
    const seen = new Set<string>();
    const order: Array<"entity" | "static" | "field_value"> = ["entity", "static", "field_value"];
    for (const src of order) {
      for (const bucket of results) {
        for (const item of bucket) {
          if (item.source !== src) continue;
          if (seen.has(item.value)) continue;
          seen.add(item.value);
          merged.push(item);
        }
      }
    }

    setSuggestions(merged.slice(0, 8));
    setHighlightIndex(0);
  }

  function handleChange(next: string) {
    field.setValue(next);
    setIsOpen(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => fetchSuggestions(next), DEBOUNCE_MS);
  }

  function handleFocus() {
    setIsOpen(true);
    fetchSuggestions(field.value);
  }

  function accept(item: SuggestionItem) {
    // For airports, value is "YYZ · Toronto Pearson International" — extract just the code
    const finalValue = item.source === "static" && item.value.includes(" · ")
      ? item.value.split(" · ")[0]
      : item.value;

    field.setValue(finalValue);
    field.flush();
    if (item.payload && onEntityAccept) {
      onEntityAccept(item.payload);
    }
    setIsOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Enter") field.flush();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      accept(suggestions[highlightIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  const inputId = label ? "autocomplete-" + label.toLowerCase().replace(/\s+/g, "-") : undefined;

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
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          autoComplete="off"
        />
        {field.dirty && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <SaveIndicator state={field.saveState} showText={false} />
          </div>
        )}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <button
                key={s.value + ":" + idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  accept(s);
                }}
                onMouseEnter={() => setHighlightIndex(idx)}
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
        )}
      </div>
      {helperText && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
}
