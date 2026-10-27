import { describe, it, expect } from "vitest";
import {
  deriveDayByDay,
  formatDateISOInTimezone,
  computeTodayInTimezone,
} from "./derive";

function fixture(overrides: any = {}): any {
  return { id: 1, title: "Test Itinerary", sections: [], ...overrides };
}
function section(overrides: any = {}): any {
  return { id: 1, title: "Section", position: 0, days: [], stays: [], ...overrides };
}
function day(overrides: any = {}): any {
  return {
    id: 1, sectionId: 1, date: "2026-01-01", dayNumber: 1,
    orderMode: "time", segments: [], blocks: [], ...overrides,
  };
}
function stay(overrides: any = {}): any {
  return {
    id: 1, sectionId: 1, hotelName: "Hotel",
    checkInDate: "2026-01-01", checkOutDate: "2026-01-03",
    checkInTime: "15:00", checkOutTime: "11:00",
    ...overrides,
  };
}
function seg(overrides: any = {}): any {
  return {
    id: 1, dayId: 1, type: "activity",
    title: "Activity", startTime: null, endTime: null,
    location: null, instructions: null, confirmation: null,
    airline: null, flightNumber: null, legs: [],
    ...overrides,
  };
}

describe("formatDateISOInTimezone", () => {
  it("returns YYYY-MM-DD in given timezone", () => {
    const d = new Date("2026-01-15T12:00:00Z");
    expect(formatDateISOInTimezone(d, "America/Toronto")).toBe("2026-01-15");
    expect(formatDateISOInTimezone(d, "Asia/Tokyo")).toBe("2026-01-15");
  });

  it("different timezones produce different dates at same instant", () => {
    const d = new Date("2026-01-15T03:00:00Z");
    expect(formatDateISOInTimezone(d, "America/Toronto")).toBe("2026-01-14");
    expect(formatDateISOInTimezone(d, "Asia/Tokyo")).toBe("2026-01-15");
  });

  it("null timezone falls back to UTC", () => {
    const d = new Date("2026-01-15T23:30:00Z");
    expect(formatDateISOInTimezone(d, null)).toBe("2026-01-15");
  });

  it("invalid timezone falls back to UTC", () => {
    const d = new Date("2026-01-15T23:30:00Z");
    expect(formatDateISOInTimezone(d, "Invalid/Zone")).toBe("2026-01-15");
  });
});

describe("computeTodayInTimezone", () => {
  it("uses now parameter", () => {
    const d = new Date("2026-03-15T10:00:00Z");
    expect(computeTodayInTimezone("America/Toronto", d)).toBe("2026-03-15");
  });
});

describe("deriveDayByDay", () => {
  it("pre-trip: today before earliest", () => {
    const full = fixture({
      sections: [section({ days: [day({ date: "2026-01-15" })] })],
    });
    const r = deriveDayByDay(full, "2026-01-01", "Tokyo");
    expect(r.state).toBe("pre-trip");
    if (r.state === "pre-trip") {
      expect(r.daysUntil).toBe(14);
      expect(r.destination).toBe("Tokyo");
    }
  });

  it("pre-trip across month boundary", () => {
    const full = fixture({
      sections: [section({ days: [day({ date: "2026-02-05" })] })],
    });
    const r = deriveDayByDay(full, "2026-01-28", "Tokyo");
    if (r.state === "pre-trip") expect(r.daysUntil).toBe(8);
  });

  it("during-trip: today matches a day", () => {
    const full = fixture({
      sections: [section({ days: [day({ date: "2026-01-01" })] })],
    });
    const r = deriveDayByDay(full, "2026-01-01", "Tokyo");
    expect(r.state).toBe("during-trip");
    if (r.state === "during-trip") {
      expect(r.day.dayNumber).toBe(1);
      expect(r.day.date).toBe("2026-01-01");
    }
  });

  it("no-plan-today: today in window but no day row", () => {
    const full = fixture({
      sections: [section({
        days: [day({ date: "2026-01-01" }), day({ id: 3, date: "2026-01-03" })],
      })],
    });
    const r = deriveDayByDay(full, "2026-01-02", "Tokyo");
    expect(r.state).toBe("no-plan-today");
  });

  it("post-trip: today after latest", () => {
    const full = fixture({
      sections: [section({ days: [day({ date: "2026-01-01" })] })],
    });
    const r = deriveDayByDay(full, "2026-02-01", "Tokyo");
    expect(r.state).toBe("post-trip");
  });

  it("no-window: no days", () => {
    const full = fixture({ sections: [] });
    const r = deriveDayByDay(full, "2026-01-01", "Tokyo");
    expect(r.state).toBe("no-window");
  });

  it("segments ordered by startTime, null last", () => {
    const full = fixture({
      sections: [section({
        days: [day({
          date: "2026-01-01",
          segments: [
            seg({ id: 1, title: "Late", startTime: "14:00" }),
            seg({ id: 2, title: "Early", startTime: "08:00" }),
            seg({ id: 3, title: "NullTime", startTime: null }),
          ],
        })],
      })],
    });
    const r = deriveDayByDay(full, "2026-01-01", "Tokyo");
    if (r.state === "during-trip") {
      expect(r.day.segments.map(s => s.title)).toEqual(["Early", "Late", "NullTime"]);
    }
  });

  it("medium detail included: title, times, location", () => {
    const full = fixture({
      sections: [section({
        days: [day({
          date: "2026-01-01",
          segments: [seg({
            title: "Museum",
            startTime: "09:00",
            endTime: "17:00",
            location: "Shibuya",
          })],
        })],
      })],
    });
    const r = deriveDayByDay(full, "2026-01-01", "Tokyo");
    if (r.state === "during-trip") {
      expect(r.day.segments[0].title).toBe("Museum");
      expect(r.day.segments[0].startTime).toBe("09:00");
      expect(r.day.segments[0].endTime).toBe("17:00");
      expect(r.day.segments[0].location).toBe("Shibuya");
    }
  });

  it("data leakage: no instructions, no confirmation, no references", () => {
    const full = fixture({
      sections: [section({
        days: [day({
          date: "2026-01-01",
          segments: [seg({
            title: "Flight",
            type: "travel",
            instructions: "Meet at gate 5",
            confirmation: "ABC123",
            referenceLabel: "Booking",
            legs: [{ travelMode: "flight", operator: "AC", identifier: "AC1" }],
          })],
        })],
        stays: [stay({ notes: "Call ahead", address: "123 Main St" })],
      })],
    });
    const r = deriveDayByDay(full, "2026-01-01", "Tokyo");
    const s = JSON.stringify(r);
    expect(s).not.toContain("Meet at gate");
    expect(s).not.toContain("ABC123");
    expect(s).not.toContain("Booking");
    expect(s).not.toContain("Call ahead");
    expect(s).not.toContain("123 Main St");
  });

  it("stay: isCheckinDay and isCheckoutDay flags", () => {
    const full = fixture({
      sections: [section({
        days: [day({ date: "2026-01-01" }), day({ id: 2, date: "2026-01-02" })],
        stays: [stay({ checkInDate: "2026-01-01", checkOutDate: "2026-01-02" })],
      })],
    });
    const checkin = deriveDayByDay(full, "2026-01-01", "Tokyo");
    if (checkin.state === "during-trip") {
      expect(checkin.day.stay?.isCheckinDay).toBe(true);
      expect(checkin.day.stay?.isCheckoutDay).toBe(false);
    }
    const checkout = deriveDayByDay(full, "2026-01-02", "Tokyo");
    if (checkout.state === "during-trip") {
      expect(checkout.day.stay).toBeNull(); // checkout day, no current stay
    }
  });

  it("travel segment gets transport object with legCount", () => {
    const full = fixture({
      sections: [section({
        days: [day({
          date: "2026-01-01",
          segments: [seg({
            type: "travel",
            title: "Flight",
            legs: [
              { travelMode: "flight", operator: "AC", identifier: "AC1", origin: "YYZ", destination: "NRT" },
              { travelMode: "flight", operator: "AC", identifier: "AC2", origin: "NRT", destination: "HND" },
            ],
          })],
        })],
      })],
    });
    const r = deriveDayByDay(full, "2026-01-01", "Tokyo");
    if (r.state === "during-trip") {
      expect(r.day.segments[0].transport?.legCount).toBe(2);
      expect(r.day.segments[0].transport?.operator).toBe("AC");
      expect(r.day.segments[0].transport?.origin).toBe("YYZ");
    }
  });

  it("multi-section: correct day lookup", () => {
    const full = fixture({
      sections: [
        section({ id: 1, title: "Tokyo", days: [
          day({ id: 1, date: "2026-01-01", dayNumber: 1 }),
          day({ id: 2, date: "2026-01-02", dayNumber: 2 }),
        ]}),
        section({ id: 2, title: "Kyoto", days: [
          day({ id: 3, date: "2026-01-03", dayNumber: 1 }),
        ]}),
      ],
    });
    const r = deriveDayByDay(full, "2026-01-03", "Japan");
    if (r.state === "during-trip") {
      expect(r.day.sectionTitle).toBe("Kyoto");
      expect(r.day.dayNumber).toBe(3); // global counter
    }
  });
});
