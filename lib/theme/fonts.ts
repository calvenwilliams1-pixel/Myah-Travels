import {
  Playfair_Display,
  Inter,
  Fraunces,
  Source_Sans_3,
  DM_Serif_Display,
  DM_Sans,
  Lora,
  Nunito_Sans,
  Cormorant_Garamond,
  Jost,
  Montserrat,
  Open_Sans,
} from "next/font/google";

/**
 * Font loaders for the six curated pairings (metadata and labels:
 * `lib/theme/font-pairings.ts`).
 *
 * Which pairing is live is the owner's `font_pairing` setting:
 * ThemeProvider reads it and points `--font-display` / `--font-sans`
 * at the chosen pair's variables (globals.css keeps pairing A as
 * the static default for anything outside the provider). Only the
 * default pairing preloads; the rest load on first use, so offering
 * six costs one pairing's worth of fonts on a normal visit.
 *
 * A: Playfair Display + Inter        — Classic
 * B: Fraunces + Source Sans 3        — Warm
 * C: DM Serif Display + DM Sans      — Modern
 * D: Lora + Nunito Sans              — Storybook
 * E: Cormorant Garamond + Jost       — Luxury
 * F: Montserrat + Open Sans          — Bold
 *
 * Discipline (per plan): latin + latin-ext subsets only (accented
 * destination names — Cancún, São Paulo), 2–3 weights per family.
 * Japanese text falls back to system fonts by decision.
 */
export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display-a",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-a",
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display-b",
  display: "swap",
  preload: false,
});

export const sourceSans = Source_Sans_3({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-sans-b",
  display: "swap",
  preload: false,
});

export const dmSerif = DM_Serif_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400"],
  variable: "--font-display-c",
  display: "swap",
  preload: false,
});

export const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-sans-c",
  display: "swap",
  preload: false,
});

export const lora = Lora({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display-d",
  display: "swap",
  preload: false,
});

export const nunitoSans = Nunito_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-sans-d",
  display: "swap",
  preload: false,
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-display-e",
  display: "swap",
  preload: false,
});

export const jost = Jost({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-sans-e",
  display: "swap",
  preload: false,
});

export const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display-f",
  display: "swap",
  preload: false,
});

export const openSans = Open_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-sans-f",
  display: "swap",
  preload: false,
});

/** Class string for <html>: registers all twelve font CSS variables. */
export const fontVariables = [
  playfair.variable,
  inter.variable,
  fraunces.variable,
  sourceSans.variable,
  dmSerif.variable,
  dmSans.variable,
  lora.variable,
  nunitoSans.variable,
  cormorant.variable,
  jost.variable,
  montserrat.variable,
  openSans.variable,
].join(" ");
