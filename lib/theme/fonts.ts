import { Playfair_Display, Inter, Fraunces, Source_Sans_3 } from "next/font/google";

/**
 * Font pairings for the UI style plan (Pass 1a).
 *
 * Two curated pairings are loaded; which one is live is decided by two
 * lines in globals.css (`--font-display` / `--font-sans` point at the
 * A or B variables below), so switching pairings is a one-line change.
 * Once the trial pick is final, the losing pair's loader is deleted.
 *
 * A: Playfair Display + Inter      — timeless, editorial
 * B: Fraunces + Source Sans 3      — warmer, more personality
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

/** Class string for <html>: registers all four font CSS variables. */
export const fontVariables = [
  playfair.variable,
  inter.variable,
  fraunces.variable,
  sourceSans.variable,
].join(" ");
