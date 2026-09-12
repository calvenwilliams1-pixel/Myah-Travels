// ============================================================
// DATE/TIME INPUT HELPERS
// Chromium's native date/time inputs select text on click instead
// of opening the picker. This helper triggers showPicker() to
// make the whole input clickable.
// ============================================================

import React from "react";

export function openPickerOnClick(
  e: React.MouseEvent<HTMLInputElement>
): void {
  const input = e.currentTarget;
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Some browsers throw if the picker is already open — ignore
    }
  }
}
