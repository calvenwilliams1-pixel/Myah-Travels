import { describe, it, expect } from "vitest";
import { ALL_TIMEZONES, TIMEZONE_GROUPS } from "./timezones";
import { getAirports } from "../suggestions/statics";

// The picker and the airport catalog are one system: any timezone an
// airport can produce must be selectable in the UI. The old hand-kept
// list covered 80 of the catalog's 327 zones.

describe("timezone picker coverage", () => {
  it("offers the full IANA set", () => {
    expect(ALL_TIMEZONES.length).toBeGreaterThan(350);
    expect(TIMEZONE_GROUPS[0]).toEqual({ region: "UTC", zones: ["UTC"] });
  });

  it("covers every timezone in the airport catalog", () => {
    const picker = new Set(ALL_TIMEZONES);
    const missing = [...new Set(getAirports().map((a) => a.timezone).filter(Boolean))].filter(
      (tz) => !picker.has(tz as string)
    );
    expect(missing).toEqual([]);
  });

  it("includes zones the old static list lacked", () => {
    expect(ALL_TIMEZONES).toContain("Pacific/Tahiti");
    expect(ALL_TIMEZONES).toContain("America/Caracas");
    expect(ALL_TIMEZONES).toContain("Atlantic/Canary");
  });
});
