import React from "react";
import { getAllSettings } from "@/lib/settings";
import { clampOpacity, sanitizeBackgroundImage, hexToRgba, darkenHex, hexToRgb } from "@/lib/theme";
import { fontPairingVars } from "@/lib/theme/font-pairings";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default async function ThemeProvider({ children }: ThemeProviderProps) {
  const settings = await getAllSettings();

  const primaryColor = settings.primary_color || "#4a7c59";
  // Darker shade for hover states (simple darken by 15%)
  const primaryColorDark = darkenHex(primaryColor, 0.85);
  // Secondary derived from primary (subtle surfaces)
  const secondaryColor = primaryColor;
  const accentColor = settings.accent_color || "#6b9ac4";
  const accentColorDark = darkenHex(accentColor, 0.85);

  const primaryRgb = hexToRgb(primaryColor);
  const primaryDarkRgb = hexToRgb(primaryColorDark);
  const secondaryRgb = hexToRgb(secondaryColor);
  const secondaryDarkRgb = hexToRgb(primaryColorDark);
  const accentRgb = hexToRgb(accentColor);
  const accentDarkRgb = hexToRgb(accentColorDark);
  const backgroundColor = "#ffffff";

  // Background is fixed white - no overlay needed

  const style: React.CSSProperties & Record<string, string> = {
    ["--color-primary" as string]: primaryColor,
    ["--color-primary-dark" as string]: primaryColorDark,
    ["--color-primary-rgb" as string]: primaryRgb,
    ["--color-primary-dark-rgb" as string]: primaryDarkRgb,
    ["--color-secondary" as string]: secondaryColor,
    ["--color-secondary-dark" as string]: primaryColorDark,
    ["--color-secondary-rgb" as string]: secondaryRgb,
    ["--color-secondary-dark-rgb" as string]: secondaryDarkRgb,
    ["--color-accent" as string]: accentColor,
    ["--color-accent-dark" as string]: accentColorDark,
    ["--color-accent-rgb" as string]: accentRgb,
    ["--color-accent-dark-rgb" as string]: accentDarkRgb,
    ["--color-background" as string]: backgroundColor,
    // The owner's font pairing (Settings → Font Style). Falls back
    // to Classic when unset or invalid; globals.css carries the
    // same default for anything outside this provider.
    ...fontPairingVars(settings.font_pairing),
    backgroundColor,
  };

  return (
    // font-sans on the wrapper itself: text that inherits its font
    // (most body copy) must inherit from HERE, where the owner's
    // font_pairing variables live — the <body> font-sans resolves
    // against the static :root default and would otherwise win by
    // inheritance for everything without its own font utility.
    <div style={style} className="theme-wrapper font-sans min-h-screen relative">
      <div className="relative z-10">{children}</div>
    </div>
  );
}
