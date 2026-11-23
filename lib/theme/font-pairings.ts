/**
 * Font pairings metadata (pure data — safe to import anywhere,
 * including client components).
 *
 * The actual next/font loaders live in `lib/theme/fonts.ts` and
 * register one CSS variable per family (`--font-display-a`,
 * `--font-sans-a`, ...). This module names the pairings, gives them
 * plain-language labels for the Settings picker, and resolves the
 * saved `font_pairing` setting to the two CSS variables the theme
 * runs on.
 *
 * History: Pass 1a shipped two pairings with a one-time pick (D1).
 * Cal replaced the pick with a Settings choice on Nov 23, 2026 —
 * same model as the colour palettes: a few curated options the
 * owner can switch between, never freeform font controls.
 */
export interface FontPairing {
  id: string;
  name: string;
  blurb: string;
  displayVar: string;
  sansVar: string;
}

export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "a",
    name: "Classic",
    blurb: "Timeless and editorial, like a travel magazine.",
    displayVar: "--font-display-a",
    sansVar: "--font-sans-a",
  },
  {
    id: "b",
    name: "Warm",
    blurb: "Softer and friendlier, a little more personality.",
    displayVar: "--font-display-b",
    sansVar: "--font-sans-b",
  },
  {
    id: "c",
    name: "Modern",
    blurb: "Clean and polished, all one family.",
    displayVar: "--font-display-c",
    sansVar: "--font-sans-c",
  },
  {
    id: "d",
    name: "Storybook",
    blurb: "Gentle and easy to read, made for long stories.",
    displayVar: "--font-display-d",
    sansVar: "--font-sans-d",
  },
  {
    id: "e",
    name: "Luxury",
    blurb: "Light and elegant — resort and honeymoon energy.",
    displayVar: "--font-display-e",
    sansVar: "--font-sans-e",
  },
  {
    id: "f",
    name: "Bold",
    blurb: "Strong and simple, nothing delicate about it.",
    displayVar: "--font-display-f",
    sansVar: "--font-sans-f",
  },
];

export const DEFAULT_FONT_PAIRING_ID = "a";

export function resolveFontPairing(id: string | undefined | null): FontPairing {
  return (
    FONT_PAIRINGS.find((p) => p.id === id) ??
    FONT_PAIRINGS.find((p) => p.id === DEFAULT_FONT_PAIRING_ID)!
  );
}

export function isFontPairingId(id: string): boolean {
  return FONT_PAIRINGS.some((p) => p.id === id);
}

/** CSS variables that point the theme at the chosen pairing. */
export function fontPairingVars(id: string | undefined | null): Record<string, string> {
  const pairing = resolveFontPairing(id);
  return {
    "--font-display": `var(${pairing.displayVar})`,
    "--font-sans": `var(${pairing.sansVar})`,
  };
}

/**
 * Override variables for a per-itinerary pairing. Returns undefined
 * when the itinerary has no pairing of its own — the caller then
 * renders without an override and the site-wide setting applies.
 * An unrecognized stored id also yields undefined (inherit rather
 * than guess).
 */
export function fontPairingOverrideVars(
  id: string | undefined | null
): Record<string, string> | undefined {
  if (!id || !isFontPairingId(id)) return undefined;
  return fontPairingVars(id);
}
