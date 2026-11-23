import { describe, it, expect } from "vitest";
import {
  datePartOf,
  daysBetweenISODate,
  addDaysToISODate,
  wallMinutesBetween,
  todayISOInTimezone,
} from "./dates";

describe("datePartOf", () => {
  it("takes the calendar date as written", () => {
    expect(datePartOf("2026-06-01T22:00")).toBe("2026-06-01");
    expect(datePartOf("2026-06-01")).toBe("2026-06-01");
    expect(datePartOf("not a date")).toBeNull();
    expect(datePartOf(null)).toBeNull();
  });
});

describe("addDaysToISODate", () => {
  it("crosses the spring-forward day without shifting", () => {
    // 2026-03-08 is the North American spring-forward day; local-Date
    // arithmetic on a machine west of UTC used to land on the same day.
    expect(addDaysToISODate("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDaysToISODate("2026-03-07", 1)).toBe("2026-03-08");
  });
  it("crosses month, year and leap boundaries", () => {
    expect(addDaysToISODate("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToISODate("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDaysToISODate("2026-01-31", 1)).toBe("2026-02-01");
  });
  it("returns null for garbage", () => {
    expect(addDaysToISODate("junk", 1)).toBeNull();
  });
});

describe("daysBetweenISODate", () => {
  it("counts whole days both directions", () => {
    expect(daysBetweenISODate("2026-06-01", "2026-06-02")).toBe(1);
    expect(daysBetweenISODate("2026-06-02", "2026-06-01")).toBe(-1);
    expect(daysBetweenISODate("2026-06-01", "2026-06-01")).toBe(0);
  });
});

describe("wallMinutesBetween", () => {
  it("compares wall clocks as written, including across midnight", () => {
    expect(wallMinutesBetween("2026-06-01T13:05", "2026-06-01T14:50")).toBe(105);
    expect(wallMinutesBetween("2026-06-01T23:40", "2026-06-02T00:35")).toBe(55);
  });
  it("is wall-clock across a DST jump (same airport, same clock)", () => {
    expect(wallMinutesBetween("2026-03-08T01:30", "2026-03-08T03:30")).toBe(120);
  });
  it("returns null for missing or unparseable values", () => {
    expect(wallMinutesBetween(null, "2026-06-01T10:00")).toBeNull();
    expect(wallMinutesBetween("2026-06-01", "2026-06-01T10:00")).toBeNull();
  });
});

describe("todayISOInTimezone", () => {
  it("answers per-zone for the same instant", () => {
    const instant = new Date("2026-11-24T01:30:00Z");
    expect(todayISOInTimezone("America/Toronto", instant)).toBe("2026-11-23");
    expect(todayISOInTimezone("UTC", instant)).toBe("2026-11-24");
    expect(todayISOInTimezone("Asia/Tokyo", instant)).toBe("2026-11-24");
    expect(todayISOInTimezone(null, instant)).toBe("2026-11-24");
    expect(todayISOInTimezone("Bogus/Zone", instant)).toBe("2026-11-24");
  });
});
