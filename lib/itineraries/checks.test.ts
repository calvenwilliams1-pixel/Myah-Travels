import { describe, it, expect } from "vitest";
import { checkTrip, type CheckSection } from "./checks";
import { zonedWallToUtcMs } from "./dates";

function section(partial: Partial<CheckSection>): CheckSection {
  return { title: "Section", startDate: null, endDate: null, days: [], stays: [], ...partial };
}

function day(date: string, legs: any[] = []) {
  return {
    date,
    segments: legs.length ? [{ type: "travel", legs }] : [],
  };
}

describe("zonedWallToUtcMs", () => {
  it("converts wall time to the right instant across zones and DST", () => {
    // Toronto winter (EST, UTC-5): noon → 17:00 UTC
    expect(zonedWallToUtcMs("2027-01-15T12:00", "America/Toronto")).toBe(Date.UTC(2027, 0, 15, 17, 0));
    // Toronto summer (EDT, UTC-4): noon → 16:00 UTC
    expect(zonedWallToUtcMs("2027-07-15T12:00", "America/Toronto")).toBe(Date.UTC(2027, 6, 15, 16, 0));
    // Tokyo (UTC+9): noon → 03:00 UTC
    expect(zonedWallToUtcMs("2027-01-15T12:00", "Asia/Tokyo")).toBe(Date.UTC(2027, 0, 15, 3, 0));
    expect(zonedWallToUtcMs("garbage", "Asia/Tokyo")).toBeNull();
    expect(zonedWallToUtcMs("2027-01-15T12:00", "Not/AZone")).toBeNull();
  });
});

describe("checkTrip", () => {
  it("a clean trip produces no warnings and full nights accounting", () => {
    const r = checkTrip([
      section({
        title: "Toronto",
        startDate: "2027-03-01",
        endDate: "2027-03-04",
        days: [day("2027-03-01"), day("2027-03-02"), day("2027-03-03"), day("2027-03-04")],
        stays: [
          { hotelName: "Fairmont", checkInDate: "2027-03-01", checkOutDate: "2027-03-04" },
        ],
      }),
    ]);
    expect(r.warnings).toEqual([]);
    expect(r.totalNights).toBe(3);
    expect(r.accountedNights).toBe(3);
  });

  it("flags a stay outside its section dates", () => {
    const r = checkTrip([
      section({
        title: "Cruise",
        startDate: "2027-03-04",
        endDate: "2027-03-10",
        stays: [
          { hotelName: "Late Hotel", checkInDate: "2027-03-09", checkOutDate: "2027-03-12" },
        ],
      }),
    ]);
    expect(r.warnings.some((w) => w.includes("falls outside"))).toBe(true);
  });

  it("flags overlapping stays", () => {
    const r = checkTrip([
      section({
        stays: [
          { hotelName: "Hotel A", checkInDate: "2027-03-01", checkOutDate: "2027-03-05" },
          { hotelName: "Hotel B", checkInDate: "2027-03-04", checkOutDate: "2027-03-08" },
        ],
      }),
    ]);
    expect(r.warnings.some((w) => w.includes("overlap") && w.includes("Mar 4"))).toBe(true);
  });

  it("lists nights with no stay", () => {
    const r = checkTrip([
      section({
        title: "Cruise",
        days: [day("2027-03-01"), day("2027-03-02"), day("2027-03-03"), day("2027-03-04")],
        stays: [
          { hotelName: "Ship", kind: "cruise", checkInDate: "2027-03-01", checkOutDate: "2027-03-03" },
        ],
      }),
    ]);
    expect(r.accountedNights).toBe(2);
    expect(r.warnings.some((w) => w.includes("no stay: Mar 3"))).toBe(true);
  });

  it("flags a flight that arrives before it departs once timezones count", () => {
    const r = checkTrip([
      section({
        days: [
          day("2027-03-01", [
            {
              travelMode: "flight",
              origin: "Toronto (YYZ)",
              destination: "London (LHR)",
              departureAt: "2027-03-01T08:00",
              arrivalAt: "2027-03-01T07:00",
              originTimezone: "America/Toronto",
              destinationTimezone: "Europe/London",
              operator: "Air Canada",
              identifier: "AC123",
            },
          ]),
        ],
      }),
    ]);
    expect(r.warnings.some((w) => w.includes("AC123") && w.includes("arrives before it departs"))).toBe(true);
  });

  it("accepts a normal overnight eastbound flight", () => {
    const r = checkTrip([
      section({
        days: [
          day("2027-03-01", [
            {
              travelMode: "flight",
              origin: "Toronto (YYZ)",
              destination: "London (LHR)",
              departureAt: "2027-03-01T22:00",
              arrivalAt: "2027-03-02T10:00",
              originTimezone: "America/Toronto",
              destinationTimezone: "Europe/London",
              operator: "Air Canada",
              identifier: "AC888",
            },
          ]),
        ],
      }),
    ]);
    expect(r.warnings).toEqual([]);
  });

  it("flags a leg with a missing timezone", () => {
    const r = checkTrip([
      section({
        days: [
          day("2027-03-01", [
            {
              travelMode: "flight",
              origin: "Toronto (YYZ)",
              destination: "London (LHR)",
              departureAt: "2027-03-01T22:00",
              arrivalAt: "2027-03-02T10:00",
              originTimezone: null,
              destinationTimezone: "Europe/London",
              operator: null,
              identifier: "AC999",
            },
          ]),
        ],
      }),
    ]);
    expect(r.warnings.some((w) => w.includes("AC999") && w.includes("no timezone"))).toBe(true);
  });
});
