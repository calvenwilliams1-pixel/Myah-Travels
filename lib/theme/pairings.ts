import { PALETTES, type Palette } from "./palettes";
import { darkenHex } from "./index";

/**
 * Palette pairing table (UI style plan, Pass 2a item 3) — the single
 * source of truth for which palette colours may sit on which
 * backgrounds, and at what text grade. Components take their
 * itinerary colours from here (via the --itinerary-* variables), and
 * pairings.test.ts asserts every pairing meets WCAG thresholds:
 * 4.5:1 for body/small text, 3:1 for large text and UI elements.
 *
 * Brand colours (site settings) are the owner's own choice and are
 * not asserted here; the curated palettes are.
 */

export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Darken a colour in steps until it meets `target` against `bg`. */
export function darkenUntil(hex: string, bg: string, target: number): string {
  let current = hex;
  for (let i = 0; i < 20 && contrastRatio(current, bg) < target; i++) {
    current = darkenHex(current, 0.92);
  }
  return current;
}

export interface PalettePairings {
  name: string;
  /** Palette primary on white — headings and other large text (≥3:1). */
  headingOnWhite: string;
  /** Small palette-coloured text on white (≥4.5:1) — darkened if needed. */
  smallTextOnWhite: string;
  /** Background shade for bands carrying white text (white on it ≥4.5:1). */
  bandBackground: string;
  /** Accent as a UI element (borders, bars) on white (≥3:1) — darkened if needed. */
  accentUiOnWhite: string;
}

export function palettePairings(palette: Pick<Palette, "name" | "primary" | "accent">): PalettePairings {
  const small = darkenUntil(palette.primary, "#ffffff", 4.5);
  return {
    name: palette.name,
    headingOnWhite: palette.primary,
    smallTextOnWhite: small,
    bandBackground: small,
    accentUiOnWhite: darkenUntil(palette.accent, "#ffffff", 3.0),
  };
}

export const PALETTE_PAIRINGS: PalettePairings[] = PALETTES.map(palettePairings);
