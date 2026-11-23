"use client";

import React, { useState } from "react";
import { FONT_PAIRINGS, resolveFontPairing } from "@/lib/theme/font-pairings";

/**
 * Font Style picker for Settings — the font sibling of PalettePicker.
 *
 * Six curated pairings; picking one writes the hidden `font_pairing`
 * input inside the settings form, and the choice takes effect when
 * the form is saved (ThemeProvider points the theme's font variables
 * at the chosen pair). Each option previews itself: its name is set
 * in its own display font and the sample line in its own body font.
 */
export default function FontPicker({ current }: { current?: string }) {
  const [selected, setSelected] = useState(resolveFontPairing(current).id);

  const pick = (id: string) => {
    setSelected(id);
    const input = document.getElementById("font_pairing") as HTMLInputElement | null;
    if (input) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
      descriptor?.set?.call(input, id);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  return (
    <div className="mb-6 mt-8">
      <p className="text-sm text-gray-600 mb-3">
        Font style — headings and text for the whole site:
      </p>
      <input type="hidden" id="font_pairing" name="font_pairing" defaultValue={selected} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {FONT_PAIRINGS.map((pairing) => (
          <button
            key={pairing.id}
            type="button"
            onClick={() => pick(pairing.id)}
            aria-pressed={selected === pairing.id}
            className={`text-left p-4 border rounded-lg transition-colors ${
              selected === pairing.id
                ? "border-primary ring-2 ring-[var(--color-primary)]"
                : "border-gray-200 hover:border-primary"
            }`}
          >
            <span
              className="block text-xl leading-snug"
              style={{ fontFamily: `var(${pairing.displayVar})` }}
            >
              {pairing.name} — Cancún awaits
            </span>
            <span
              className="block text-sm text-gray-600 mt-1"
              style={{ fontFamily: `var(${pairing.sansVar})` }}
            >
              {pairing.blurb}
            </span>
            {selected === pairing.id && (
              <span className="block text-xs font-medium text-primary mt-2">
                Selected — applies when you save
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
