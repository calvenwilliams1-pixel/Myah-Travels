"use client";

import React, { useEffect, useRef } from "react";
import { useAutosaveField } from "@/lib/hooks/useAutosaveField";
import SaveIndicator from "@/components/admin/SaveIndicator";

interface AutosaveTextareaFieldProps {
  label?: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  draftKey?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  rows?: number;
}

/**
 * Multiline counterpart to AutosaveTextField: same 500ms debounce autosave,
 * per-keystroke localStorage draft, blur/unmount flush, and save indicator.
 * Replaces the old blur-only instructions textarea (2026-11-22).
 */
export default function AutosaveTextareaField({
  label,
  value,
  onSave,
  draftKey,
  placeholder,
  helperText,
  disabled,
  rows = 2,
}: AutosaveTextareaFieldProps) {
  const field = useAutosaveField<string>({
    value,
    onSave,
    draftKey,
  });

  // Sync external value changes (e.g. snippet insert, parent re-render)
  const lastExternalValueRef = useRef(value);
  useEffect(() => {
    if (value !== lastExternalValueRef.current) {
      lastExternalValueRef.current = value;
      if (field.value !== value) {
        field.setValue(value);
      }
    }
  }, [value, field]);

  const inputId = label
    ? `autosave-textarea-${label.toLowerCase().replace(/\s+/g, "-")}`
    : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          id={inputId}
          value={field.value}
          onChange={(e) => field.setValue(e.target.value)}
          onBlur={() => field.flush()}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] text-sm"
        />
        {field.dirty && (
          <div className="absolute right-2 top-2">
            <SaveIndicator state={field.saveState} />
          </div>
        )}
      </div>
      {helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
