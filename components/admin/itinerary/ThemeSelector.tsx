"use client";

import React from "react";
import { PALETTES } from "@/lib/theme/palettes";

interface ThemeSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  inheritLabel: string;
  label?: string;
  helperText?: string;
}

export default function ThemeSelector({
  value,
  onChange,
  inheritLabel,
  label,
  helperText,
}: ThemeSelectorProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] cursor-pointer"
      >
        <option value="">{inheritLabel}</option>
        {PALETTES.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
