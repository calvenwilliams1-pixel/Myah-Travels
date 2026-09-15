// Single source of truth for curated palettes.
// Consumers: admin PalettePicker, itinerary theme picker, section override picker.

export interface Palette {
  name: string;
  primary: string;
  accent: string;
}

export const PALETTES: Palette[] = [
  { name: "Coastal", primary: "#0077B6", accent: "#FFB703" },
  { name: "Desert", primary: "#8B5E3C", accent: "#FF7043" },
  { name: "Alpine", primary: "#1B4332", accent: "#4CAF50" },
  { name: "Editorial", primary: "#1D3557", accent: "#E63946" },
  { name: "Tropical", primary: "#00897B", accent: "#FF6F61" },
  { name: "Minimal", primary: "#374151", accent: "#2563EB" },
];

export function getPalette(name: string | null | undefined): Palette | null {
  if (!name) return null;
  return PALETTES.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export function isValidPaletteName(name: string | null | undefined): boolean {
  if (!name) return false;
  return PALETTES.some((p) => p.name.toLowerCase() === name.toLowerCase());
}
