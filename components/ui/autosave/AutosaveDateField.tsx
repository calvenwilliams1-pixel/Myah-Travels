"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAutosaveField } from "@/lib/hooks/useAutosaveField";
import SaveIndicator from "@/components/admin/SaveIndicator";

interface AutosaveDateFieldProps {
  label?: string;
  value: string;              // YYYY-MM-DD
  onSave: (value: string) => Promise<void>;
  draftKey?: string;
  helperText?: string;
  disabled?: boolean;
  min?: string;               // YYYY-MM-DD
  max?: string;               // YYYY-MM-DD
  quickSelect?: {
    label: string;
    value: string;
  };
}

export default function AutosaveDateField({
  label,
  value,
  onSave,
  draftKey,
  helperText,
  disabled,
  min,
  max,
  quickSelect,
}: AutosaveDateFieldProps) {
  const field = useAutosaveField<string>({
    value,
    onSave,
    draftKey,
  });

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
    ? `autosave-date-${label.toLowerCase().replace(/\s+/g, "-")}`
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
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            id={inputId}
            type="date"
            value={field.value}
            onChange={(e) => field.setValue(e.target.value)}
            onBlur={() => field.flush()}
            disabled={disabled}
            min={min}
            max={max}
            className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] cursor-pointer"
          />
          {field.dirty && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <SaveIndicator state={field.saveState} showText={false} />
            </div>
          )}
        </div>
        {quickSelect && (
          <button
            type="button"
            onClick={() => field.setValue(quickSelect.value)}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 whitespace-nowrap"
          >
            {quickSelect.label}
          </button>
        )}
      </div>
      {helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
