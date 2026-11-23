import { describe, it, expect } from "vitest";
import { PALETTES } from "./palettes";
import { PALETTE_PAIRINGS, contrastRatio, palettePairings } from "./pairings";

/**
 * WCAG gates for the curated palettes (UI style plan, Pass 2a):
 * 4.5:1 for body/small text, 3:1 for large text and UI elements.
 * The pairings table is what the components render from, so a
 * palette that cannot meet the floor fails here, before it ships.
 */
describe("palette pairings meet WCAG thresholds", () => {
  it("covers every curated palette", () => {
    expect(PALETTE_PAIRINGS.map((p) => p.name).sort()).toEqual(
      PALETTES.map((p) => p.name).sort()
    );
  });

  for (const pairings of PALETTE_PAIRINGS) {
    describe(pairings.name, () => {
      it("heading colour on white meets 3:1 (large text)", () => {
        expect(contrastRatio(pairings.headingOnWhite, "#ffffff")).toBeGreaterThanOrEqual(3);
      });
      it("small text colour on white meets 4.5:1", () => {
        expect(contrastRatio(pairings.smallTextOnWhite, "#ffffff")).toBeGreaterThanOrEqual(4.5);
      });
      it("white text on the band background meets 4.5:1", () => {
        expect(contrastRatio("#ffffff", pairings.bandBackground)).toBeGreaterThanOrEqual(4.5);
      });
      it("accent as a UI element on white meets 3:1", () => {
        expect(contrastRatio(pairings.accentUiOnWhite, "#ffffff")).toBeGreaterThanOrEqual(3);
      });
    });
  }

  it("darkens a too-light primary for small text (Tropical accent case)", () => {
    // Tropical's accent #FF6F61 is ~2.9:1 on white — fine as a tint,
    // not as a UI element. The pairing must darken it.
    const tropical = palettePairings(PALETTES.find((p) => p.name === "Tropical")!);
    expect(tropical.accentUiOnWhite).not.toBe("#FF6F61");
    expect(contrastRatio(tropical.accentUiOnWhite, "#ffffff")).toBeGreaterThanOrEqual(3);
  });

  it("contrastRatio sanity: black on white is 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
});
