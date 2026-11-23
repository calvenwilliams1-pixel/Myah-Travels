import { describe, it, expect } from "vitest";
import { computeConnectionGaps, legCrossesDate, type LegTimes } from "./legMath";

function leg(legOrder: number, departureAt: string | null, arrivalAt: string | null): LegTimes {
  return { legOrder, departureAt, arrivalAt };
}

describe("legCrossesDate", () => {
  it("flags an evening departure that lands the next calendar day", () => {
    // YYZ 22:00 → LHR 11:05 next day. The old implementation parsed the
    // strings as server-local time and read the date back in UTC, which
    // erased the crossing on any machine west of UTC.
    expect(legCrossesDate(leg(1, "2026-06-01T22:00", "2026-06-02T11:05"))).toEqual({
      crosses: true,
      days: 1,
    });
  });

  it("does not flag a same-day flight", () => {
    expect(legCrossesDate(leg(1, "2026-06-01T08:00", "2026-06-01T11:30"))).toEqual({
      crosses: false,
      days: 0,
    });
  });

  it("handles a two-day crossing", () => {
    expect(legCrossesDate(leg(1, "2026-06-01T23:30", "2026-06-03T06:15"))).toEqual({
      crosses: true,
      days: 2,
    });
  });

  it("returns no crossing when times are missing", () => {
    expect(legCrossesDate(leg(1, null, "2026-06-02T11:05"))).toEqual({ crosses: false, days: 0 });
  });
});

describe("computeConnectionGaps", () => {
  it("computes a same-day layover in wall-clock minutes", () => {
    const gaps = computeConnectionGaps([
      leg(1, "2026-06-01T08:00", "2026-06-01T13:05"),
      leg(2, "2026-06-01T14:50", "2026-06-01T18:20"),
    ]);
    expect(gaps).toEqual([{ afterLegOrder: 1, minutes: 105, crossesDate: false, daysCrossed: 0 }]);
  });

  it("computes a red-eye layover across midnight", () => {
    const gaps = computeConnectionGaps([
      leg(1, "2026-06-01T19:00", "2026-06-01T23:40"),
      leg(2, "2026-06-02T00:35", "2026-06-02T05:10"),
    ]);
    expect(gaps).toEqual([{ afterLegOrder: 1, minutes: 55, crossesDate: true, daysCrossed: 1 }]);
  });

  it("sorts by leg order and skips legs without times", () => {
    const gaps = computeConnectionGaps([
      leg(2, "2026-06-01T14:50", null),
      leg(1, "2026-06-01T08:00", "2026-06-01T13:05"),
      leg(3, null, null),
    ]);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].minutes).toBe(105);
  });
});
