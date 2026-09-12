"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAutosaveField } from "@/lib/hooks/useAutosaveField";
import SaveIndicator from "@/components/admin/SaveIndicator";

interface SelectOption {
  value: string;
  label: string;
}

interface AutosaveSelectFieldProps {
  label?: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  draftKey?: string;
  helperText?: string;
  disabled?: boolean;
  options: SelectOption[];
}

export default function AutosaveSelectField({
  label,
  value,
  onSave,
  draftKey,
  helperText,
  disabled,
  options,
}: AutosaveSelectFieldProps) {
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
    ? `autosave-select-${label.toLowerCase().replace(/\s+/g, "-")}`
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
        <select
          id={inputId}
          value={field.value}
          onChange={(e) => {
            field.setValue(e.target.value);
            // Selects don't fire blur on change; flush immediately
            field.flush();
          }}
          disabled={disabled}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.dirty && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <SaveIndicator state={field.saveState} showText={false} />
          </div>
        )}
      </div>
      {helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
