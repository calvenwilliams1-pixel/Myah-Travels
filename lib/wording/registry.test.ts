import { describe, it, expect } from "vitest";
import {
  WORDING_REGISTRY,
  WORDING_BY_KEY,
  validateWordingValue,
  resolveWordingValue,
  resolveAllWording,
  resolveInviteCopy,
  substituteTokens,
  formatExpiryLabel,
} from "./registry";

describe("wording registry integrity", () => {
  it("has unique keys", () => {
    const keys = WORDING_REGISTRY.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("prefixes every settings key with wording_, except the pre-existing bio_text", () => {
    for (const entry of WORDING_REGISTRY) {
      if (entry.key === "bio_text") {
        expect(entry.settingsKey).toBe("bio_text");
      } else {
        expect(entry.settingsKey).toBe(`wording_${entry.key}`);
      }
    }
  });

  it("has no em dash in any default (the client-facing dash rule)", () => {
    for (const entry of WORDING_REGISTRY) {
      expect(entry.defaultValue, entry.key).not.toContain("—");
    }
  });

  it("every default fits its own maxLength and passes its own validation", () => {
    for (const entry of WORDING_REGISTRY) {
      expect(entry.defaultValue.length, entry.key).toBeLessThanOrEqual(entry.maxLength);
      expect(validateWordingValue(entry, entry.defaultValue), entry.key).toBeNull();
    }
  });
});

describe("generated: every registry key renders, overrides, and falls back", () => {
  const subs = { name: "Alex", portal: "Sample Trip", date: "December 5, 2026" };

  for (const entry of WORDING_REGISTRY) {
    it(`${entry.key}: default renders`, () => {
      const rendered = substituteTokens(resolveWordingValue(entry, null), subs);
      expect(rendered.length).toBeGreaterThan(0);
      expect(rendered).not.toContain("{bogus}");
    });

    it(`${entry.key}: a valid override renders`, () => {
      const override = `${entry.defaultValue} (edited)`;
      expect(validateWordingValue(entry, override)).toBeNull();
      expect(resolveWordingValue(entry, override)).toBe(override);
    });

    it(`${entry.key}: an invalid override falls back to the default`, () => {
      const invalid = `${entry.defaultValue} {bogus}`;
      expect(validateWordingValue(entry, invalid)).not.toBeNull();
      expect(resolveWordingValue(entry, invalid)).toBe(entry.defaultValue);
    });

    it(`${entry.key}: an empty override means the default`, () => {
      expect(resolveWordingValue(entry, "")).toBe(entry.defaultValue);
      expect(resolveWordingValue(entry, "   ")).toBe(entry.defaultValue);
    });
  }
});

describe("validateWordingValue", () => {
  it("refuses an over-long value and says the limit", () => {
    const entry = WORDING_BY_KEY.invite_eyebrow;
    const error = validateWordingValue(entry, "x".repeat(entry.maxLength + 1));
    expect(error).toContain(String(entry.maxLength));
  });

  it("refuses an unknown token and names it", () => {
    const error = validateWordingValue(WORDING_BY_KEY.access_note, "Tap {link} to continue");
    expect(error).toContain("{link}");
  });

  it("refuses the trip expiry line without {date}, because it would not be true", () => {
    const error = validateWordingValue(
      WORDING_BY_KEY.invite_expiry_trip,
      "This link expires soon. Contact Myah for a new one."
    );
    expect(error).toContain("{date}");
  });

  it("allows the other tokens to be dropped (only {date} is required)", () => {
    expect(
      validateWordingValue(WORDING_BY_KEY.invite_greeting, "Hello,")
    ).toBeNull();
    expect(
      validateWordingValue(
        WORDING_BY_KEY.invite_expiry_trip,
        "This link expires on {date}."
      )
    ).toBeNull();
  });
});

describe("send-time fallback (resolveInviteCopy)", () => {
  it("a stored override that fails validation falls back to the default", () => {
    const copy = resolveInviteCopy({
      wording_invite_expiry_trip: "This link expires soon, honestly.",
    });
    expect(copy.expiryTrip).toBe(WORDING_BY_KEY.invite_expiry_trip.defaultValue);
  });

  it("a valid stored override is used", () => {
    const copy = resolveInviteCopy({
      wording_invite_greeting: "Hello {name},",
    });
    expect(copy.greeting).toBe("Hello {name},");
  });

  it("resolveAllWording covers every registry key", () => {
    const all = resolveAllWording({});
    expect(Object.keys(all).sort()).toEqual(WORDING_REGISTRY.map((e) => e.key).sort());
  });
});

describe("formatExpiryLabel (pinned to America/Toronto)", () => {
  it("formats a plain date", () => {
    expect(formatExpiryLabel(new Date("2026-12-05T17:00:00Z"))).toBe("December 5, 2026");
  });

  it("respects the end-of-day boundary in Toronto, not UTC", () => {
    // 04:59:59Z is still Dec 4 in Toronto (EST, UTC-5).
    expect(formatExpiryLabel(new Date("2026-12-05T04:59:59Z"))).toBe("December 4, 2026");
    expect(formatExpiryLabel(new Date("2026-12-05T05:00:00Z"))).toBe("December 5, 2026");
  });

  it("stays correct across the spring DST changeover", () => {
    // 2026-03-08 is the spring-forward day in Toronto.
    expect(formatExpiryLabel(new Date("2026-03-09T03:59:59Z"))).toBe("March 8, 2026");
    expect(formatExpiryLabel(new Date("2026-03-09T04:00:00Z"))).toBe("March 9, 2026");
  });

  it("stays correct across the fall DST changeover", () => {
    // 2026-11-01 is the fall-back day in Toronto.
    expect(formatExpiryLabel(new Date("2026-11-01T05:59:59Z"))).toBe("November 1, 2026");
    expect(formatExpiryLabel(new Date("2026-11-02T04:59:59Z"))).toBe("November 1, 2026");
    expect(formatExpiryLabel(new Date("2026-11-02T05:00:00Z"))).toBe("November 2, 2026");
  });
});
