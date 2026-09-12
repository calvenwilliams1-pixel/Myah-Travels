"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAutosaveField } from "@/lib/hooks/useAutosaveField";
import SaveIndicator from "@/components/admin/SaveIndicator";

interface AutosaveTextFieldProps {
  label?: string;
  value: string;
  onSave: (value: string) => Promise<void>;
  draftKey?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  maxLength?: number;
}

export default function AutosaveTextField({
  label,
  value,
  onSave,
  draftKey,
  placeholder,
  helperText,
  disabled,
  maxLength,
}: AutosaveTextFieldProps) {
  const field = useAutosaveField<string>({
    value,
    onSave,
    draftKey,
  });

  // Sync external value changes (e.g. from parent re-render) into the hook
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
    ? `autosave-text-${label.toLowerCase().replace(/\s+/g, "-")}`
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
        <input
          id={inputId}
          type="text"
          value={field.value}
          onChange={(e) => field.setValue(e.target.value)}
          onBlur={() => field.flush()}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
        />
        {field.dirty && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
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
