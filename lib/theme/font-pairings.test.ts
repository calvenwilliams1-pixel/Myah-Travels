import {
  FONT_PAIRINGS,
  resolveFontPairing,
  isFontPairingId,
  fontPairingVars,
  fontPairingOverrideVars,
  DEFAULT_FONT_PAIRING_ID,
} from "./font-pairings";

describe("font pairings", () => {
  it("offers six curated pairings with unique ids a–f", () => {
    expect(FONT_PAIRINGS).toHaveLength(6);
    expect(FONT_PAIRINGS.map((p) => p.id)).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("each pairing points at its own display/sans variables", () => {
    for (const p of FONT_PAIRINGS) {
      expect(p.displayVar).toBe(`--font-display-${p.id}`);
      expect(p.sansVar).toBe(`--font-sans-${p.id}`);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.blurb.length).toBeGreaterThan(0);
    }
  });

  it("resolves a saved id, and falls back to the default for anything else", () => {
    expect(resolveFontPairing("e").name).toBe("Luxury");
    expect(resolveFontPairing(undefined).id).toBe(DEFAULT_FONT_PAIRING_ID);
    expect(resolveFontPairing(null).id).toBe(DEFAULT_FONT_PAIRING_ID);
    expect(resolveFontPairing("comic-sans").id).toBe(DEFAULT_FONT_PAIRING_ID);
    expect(resolveFontPairing("").id).toBe(DEFAULT_FONT_PAIRING_ID);
  });

  it("validates ids for the settings save path", () => {
    expect(isFontPairingId("c")).toBe(true);
    expect(isFontPairingId("z")).toBe(false);
  });

  it("builds the two theme variables for the chosen pairing", () => {
    expect(fontPairingVars("b")).toEqual({
      "--font-display": "var(--font-display-b)",
      "--font-sans": "var(--font-sans-b)",
    });
    expect(fontPairingVars("bogus")).toEqual({
      "--font-display": "var(--font-display-a)",
      "--font-sans": "var(--font-sans-a)",
    });
  });

  it("per-itinerary override: unset or unknown means inherit the site font", () => {
    expect(fontPairingOverrideVars(null)).toBeUndefined();
    expect(fontPairingOverrideVars(undefined)).toBeUndefined();
    expect(fontPairingOverrideVars("")).toBeUndefined();
    expect(fontPairingOverrideVars("bogus")).toBeUndefined();
    expect(fontPairingOverrideVars("f")).toEqual({
      "--font-display": "var(--font-display-f)",
      "--font-sans": "var(--font-sans-f)",
    });
  });
});
