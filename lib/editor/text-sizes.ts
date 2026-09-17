// Curated text sizes for the editor. Presets map to rem values so
// everything scales with the root font size. Fine-tune range is
// bounded — no free-form sizing beyond the presets' envelope.

export interface SizeOption {
  value: string;
  label: string;
}

export const SIZE_PRESETS: SizeOption[] = [
  { value: "0.875rem", label: "Small" },
  { value: "1rem", label: "Normal" },
  { value: "1.125rem", label: "Large" },
  { value: "1.25rem", label: "XL" },
  { value: "1.5rem", label: "XXL" },
];

// Fine-tune bounds. Values are pixel numbers, converted to rem.
export const SIZE_MIN_PX = 12;
export const SIZE_MAX_PX = 32;
export const SIZE_STEP_PX = 1;
