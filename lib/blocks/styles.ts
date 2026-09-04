import { TemplateStyle } from "@/types/blocks";

export type ThemeVariant = "minimal" | "travel" | "review";

export const TEMPLATE_STYLES: Record<ThemeVariant, TemplateStyle> = {
  minimal: {
    // Typography
    fontFamily: "Inter",
    headingColor: "#111111",
    headingFontSize: "24px",
    headingFontWeight: 600,
    headingMargin: "0 0 16px 0",
    bodyColor: "#333333",
    bodyLineHeight: "1.6",
    // Hero
    heroHeight: "400px",
    heroBorderRadius: "12px",
    heroMargin: "0 0 24px 0",
    // Image
    imageMaxWidth: "100%",
    imageBorderRadius: "8px",
    imageMargin: "16px 0",
    // Gallery
    galleryGap: "12px",
    galleryImageHeight: "200px",
    galleryBorderRadius: "8px",
    galleryMargin: "16px 0",
    // Quick Facts
    quickFactsBackground: "#f9fafb",
    quickFactsBorder: "#e5e7eb",
    quickFactsPadding: "20px",
    quickFactsBorderRadius: "12px",
    quickFactsMargin: "16px 0",
    quickFactsLabelColor: "#6b7280",
    quickFactsValueColor: "#111111",
    // Quote
    quoteBackground: "#f9fafb",
    quoteBorderColor: "#d1d5db",
    quotePadding: "16px 20px",
    quoteMargin: "16px 0",
    quoteTextColor: "#374151",
    quoteAuthorColor: "#6b7280",
    // Callout
    calloutBackground: "#f9f9f9",
    calloutBorder: "#e5e5e5",
    calloutTextColor: "#333333",
    // Pros/Cons
    prosBackground: "#f0fdf4",
    consBackground: "#fef2f2",
    prosConsPadding: "20px",
    prosConsBorderRadius: "12px",
    prosConsMargin: "16px 0",
    // Verdict
    verdictBackground: "#111827",
    verdictTextColor: "#f9fafb",
    verdictPadding: "24px",
    verdictBorderRadius: "12px",
    verdictMargin: "24px 0",
    starColor: "#f59e0b",
    inactiveStarColor: "#d1d5db",
  },
  travel: {
    // Typography
    fontFamily: "Inter",
    headingColor: "#4a7c59",
    headingFontSize: "24px",
    headingFontWeight: 600,
    headingMargin: "0 0 16px 0",
    bodyColor: "#333333",
    bodyLineHeight: "1.6",
    // Hero
    heroHeight: "420px",
    heroBorderRadius: "16px",
    heroMargin: "0 0 28px 0",
    // Image
    imageMaxWidth: "100%",
    imageBorderRadius: "10px",
    imageMargin: "20px 0",
    // Gallery
    galleryGap: "12px",
    galleryImageHeight: "220px",
    galleryBorderRadius: "10px",
    galleryMargin: "20px 0",
    // Quick Facts
    quickFactsBackground: "#f0fdf4",
    quickFactsBorder: "#bbf7d0",
    quickFactsPadding: "24px",
    quickFactsBorderRadius: "16px",
    quickFactsMargin: "20px 0",
    quickFactsLabelColor: "#4a7c59",
    quickFactsValueColor: "#1a2e1d",
    // Quote
    quoteBackground: "#f0fdf4",
    quoteBorderColor: "#86efac",
    quotePadding: "20px 24px",
    quoteMargin: "20px 0",
    quoteTextColor: "#1a2e1d",
    quoteAuthorColor: "#4a7c59",
    // Callout
    calloutBackground: "#f0fdf4",
    calloutBorder: "#bbf7d0",
    calloutTextColor: "#166534",
    // Pros/Cons
    prosBackground: "#f0fdf4",
    consBackground: "#fef2f2",
    prosConsPadding: "24px",
    prosConsBorderRadius: "16px",
    prosConsMargin: "20px 0",
    // Verdict
    verdictBackground: "#1a2e1d",
    verdictTextColor: "#f0fdf4",
    verdictPadding: "28px",
    verdictBorderRadius: "16px",
    verdictMargin: "28px 0",
    starColor: "#fbbf24",
    inactiveStarColor: "#d1d5db",
  },
  review: {
    // Typography
    fontFamily: "Inter",
    headingColor: "#1e3a8a",
    headingFontSize: "24px",
    headingFontWeight: 600,
    headingMargin: "0 0 16px 0",
    bodyColor: "#333333",
    bodyLineHeight: "1.6",
    // Hero
    heroHeight: "380px",
    heroBorderRadius: "8px",
    heroMargin: "0 0 20px 0",
    // Image
    imageMaxWidth: "100%",
    imageBorderRadius: "6px",
    imageMargin: "12px 0",
    // Gallery
    galleryGap: "10px",
    galleryImageHeight: "180px",
    galleryBorderRadius: "6px",
    galleryMargin: "12px 0",
    // Quick Facts
    quickFactsBackground: "#fffbeb",
    quickFactsBorder: "#fde68a",
    quickFactsPadding: "20px",
    quickFactsBorderRadius: "8px",
    quickFactsMargin: "12px 0",
    quickFactsLabelColor: "#92400e",
    quickFactsValueColor: "#1f2937",
    // Quote
    quoteBackground: "#fffbeb",
    quoteBorderColor: "#fcd34d",
    quotePadding: "16px 20px",
    quoteMargin: "12px 0",
    quoteTextColor: "#78350f",
    quoteAuthorColor: "#92400e",
    // Callout
    calloutBackground: "#fffbeb",
    calloutBorder: "#fde68a",
    calloutTextColor: "#78350f",
    // Pros/Cons
    prosBackground: "#f0fdf4",
    consBackground: "#fef2f2",
    prosConsPadding: "20px",
    prosConsBorderRadius: "8px",
    prosConsMargin: "12px 0",
    // Verdict
    verdictBackground: "#1e3a8a",
    verdictTextColor: "#eff6ff",
    verdictPadding: "24px",
    verdictBorderRadius: "8px",
    verdictMargin: "20px 0",
    starColor: "#f59e0b",
    inactiveStarColor: "#d1d5db",
  },
};

export function getTemplateStyle(variant: ThemeVariant | undefined): TemplateStyle {
  return TEMPLATE_STYLES[variant || "minimal"];
}
