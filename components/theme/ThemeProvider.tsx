import React from "react";
import { getAllSettings } from "@/lib/settings";
import { clampOpacity, sanitizeBackgroundImage, hexToRgba, darkenHex } from "@/lib/theme";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default async function ThemeProvider({ children }: ThemeProviderProps) {
  const settings = await getAllSettings();

  const primaryColor = settings.primary_color || "#4a7c59";
  // Darker shade for hover states (simple darken by 15%)
  const primaryColorDark = darkenHex(primaryColor, 0.85);
  const secondaryColor = settings.secondary_color || "#e8b84b";
  const accentColor = settings.accent_color || "#6b9ac4";
  const backgroundColor = settings.background_color || "#ffffff";
  const backgroundImage = sanitizeBackgroundImage(settings.background_image);
  const backgroundOpacity = clampOpacity(settings.background_opacity);

  const overlayAlpha = 1 - backgroundOpacity;
  const overlayColor = hexToRgba(backgroundColor, overlayAlpha);

  const style: React.CSSProperties & Record<string, string> = {
    ["--color-primary" as string]: primaryColor,
    ["--color-primary-dark" as string]: primaryColorDark,
    ["--color-secondary" as string]: secondaryColor,
    ["--color-accent" as string]: accentColor,
    ["--color-background" as string]: backgroundColor,
    backgroundColor,
  };

  if (backgroundImage) {
    style["--bg-image" as string] = `url(${encodeURI(backgroundImage)})`;
  }

  return (
    <div style={style} className="theme-wrapper min-h-screen relative">
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none lg:bg-fixed"
          style={{ backgroundImage: `url(${encodeURI(backgroundImage)})` }}
          aria-hidden="true"
        />
      )}
      {backgroundImage && overlayAlpha > 0 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: overlayColor }}
          aria-hidden="true"
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
