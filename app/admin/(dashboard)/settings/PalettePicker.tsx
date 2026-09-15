"use client";

import { PALETTES } from "@/lib/theme/palettes";

import React from "react";



export default function PalettePicker() {
  const applyPalette = (primary: string, accent: string) => {
    const setNativeValue = (input: HTMLInputElement, value: string) => {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
      descriptor?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    };

    const primaryInput = document.getElementById("primary_color") as HTMLInputElement;
    const accentInput = document.getElementById("accent_color") as HTMLInputElement;
    
    if (primaryInput) setNativeValue(primaryInput, primary);
    if (accentInput) setNativeValue(accentInput, accent);
  };

  return (
    <div className="mb-6">
      <p className="text-sm text-gray-600 mb-3">Recommended palettes:</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PALETTES.map((palette) => (
          <button
            key={palette.name}
            type="button"
            onClick={() => applyPalette(palette.primary, palette.accent)}
            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-primary transition-colors"
          >
            <span className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.primary }} />
            <span className="w-8 h-8 rounded-full" style={{ backgroundColor: palette.accent }} />
            <span className="text-sm font-medium">{palette.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
