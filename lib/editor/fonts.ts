// Curated font families for the post editor. Default is Inter —
// matches the site's established typography. All are Google Fonts,
// loaded on demand. Twelve total: four serif, six sans, one display
// serif, one mono for reference codes.

export interface FontOption {
  value: string;
  label: string;
  category: "sans" | "serif" | "display" | "mono";
}

export const FONT_OPTIONS: FontOption[] = [
  // Sans (default)
  { value: "Inter, sans-serif", label: "Inter (default)", category: "sans" },
  { value: "'Open Sans', sans-serif", label: "Open Sans", category: "sans" },
  { value: "Lato, sans-serif", label: "Lato", category: "sans" },
  { value: "Montserrat, sans-serif", label: "Montserrat", category: "sans" },
  { value: "'Source Sans Pro', sans-serif", label: "Source Sans Pro", category: "sans" },
  { value: "Raleway, sans-serif", label: "Raleway", category: "sans" },
  // Serif
  { value: "Georgia, serif", label: "Georgia", category: "serif" },
  { value: "'Merriweather', serif", label: "Merriweather", category: "serif" },
  { value: "Lora, serif", label: "Lora", category: "serif" },
  { value: "'PT Serif', serif", label: "PT Serif", category: "serif" },
  // Display serif
  { value: "'Playfair Display', serif", label: "Playfair Display", category: "display" },
  // Mono
  { value: "'JetBrains Mono', monospace", label: "JetBrains Mono", category: "mono" },
];

export const DEFAULT_FONT = "Inter, sans-serif";
