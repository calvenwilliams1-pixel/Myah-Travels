import { describe, it, expect } from "vitest";
import { deriveGlance } from "./derive";

// Minimal FullItinerary fixture builder. Tests pass a partial shape that
// deriveGlance reads; cast to any to skip the full DB type (which includes
// createdAt, updatedAt, portalId, etc. that the derive function ignores).
function fixture(overrides: any = {}): any {
  return {
    id: 1,
    title: "Test Itinerary",
    sections: [],
    ...overrides,
  };
}

function section(overrides: any = {}): any {
  return {
    id: 1,
    itineraryId: 1,
    title: "Section",
    position: 0,
    days: [],
    stays: [],
    ...overrides,
  };
}

function day(overrides: any = {}): any {
  return {
    id: 1,
    sectionId: 1,
    date: "2026-01-01",
    dayNumber: 1,
    orderMode: "time",
    segments: [],
    blocks: [],
    ...overrides,
  };
}

function stay(overrides: any = {}): any {
  return {
    id: 1,
    sectionId: 1,
    hotelName: "Hotel",
    address: "123 Main St",
    checkInDate: "2026-01-01",
    checkOutDate: "2026-01-03",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    notes: null,
    ...overrides,
  };
}

function seg(overrides: any = {}): any {
  return {
    id: 1,
    dayId: 1,
    type: "activity",
    startTime: null,
    endTime: null,
    title: "Activity",
    location: null,
    instructions: null,
    airline: null,
    flightNumber: null,
    legs: [],
    ...overrides,
  };
}

describe("deriveGlance", () => {
  it("Test 1: hotel-change day shows the new hotel", () => {
    const full = fixture({
      sections: [
        section({
          stays: [
            stay({ id: 1, hotelName: "A", checkInDate: "2026-01-01", checkOutDate: "2026-01-03" }),
            stay({ id: 2, hotelName: "B", checkInDate: "2026-01-03", checkOutDate: "2026-01-05" }),
          ],
          days: [
            day({ date: "2026-01-01" }),
            day({ date: "2026-01-02" }),
            day({ date: "2026-01-03" }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].stayName).toBe("A");
    expect(result.days[1].stayName).toBe("A");
    expect(result.days[2].stayName).toBe("B");
  });

  it("Test 2: departure day of one-hotel trip has no stay", () => {
    const full = fixture({
      sections: [
        section({
          stays: [stay({ hotelName: "Only", checkInDate: "2026-01-01", checkOutDate: "2026-01-03" })],
          days: [day({ date: "2026-01-03" })],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].stayName).toBeNull();
  });

  it("Test 3: no stay at all", () => {
    const full = fixture({
      sections: [section({ stays: [], days: [day({ date: "2026-01-01" })] })],
    });
    const result = deriveGlance(full);
    expect(result.days[0].stayName).toBeNull();
  });

  it("Test 4: zero-night stay matches nothing", () => {
    const full = fixture({
      sections: [
        section({
          stays: [stay({ hotelName: "Zero", checkInDate: "2026-01-01", checkOutDate: "2026-01-01" })],
          days: [day({ date: "2026-01-01" })],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].stayName).toBeNull();
  });

  it("Test 5: overlapping stays — later check-in wins, then checkout restores earlier stay", () => {
    const full = fixture({
      sections: [
        section({
          stays: [
            stay({ id: 1, hotelName: "A", checkInDate: "2026-01-01", checkOutDate: "2026-01-05" }),
            stay({ id: 2, hotelName: "B", checkInDate: "2026-01-02", checkOutDate: "2026-01-03" }),
          ],
          days: [
            day({ date: "2026-01-01" }),
            day({ date: "2026-01-02" }),
            day({ date: "2026-01-03" }),
            day({ date: "2026-01-04" }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].stayName).toBe("A");
    expect(result.days[1].stayName).toBe("B");
    expect(result.days[2].stayName).toBe("A");
    expect(result.days[3].stayName).toBe("A");
  });

  it("Test 6: two flights in a day, ordered by startTime", () => {
    const full = fixture({
      sections: [
        section({
          days: [
            day({
              segments: [
                seg({ id: 1, type: "travel", startTime: "14:00", legs: [{ travelMode: "flight", operator: "AC", identifier: "AC2" }] }),
                seg({ id: 2, type: "travel", startTime: "08:00", legs: [{ travelMode: "flight", operator: "AC", identifier: "AC1" }] }),
              ],
            }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].transport.length).toBe(2);
    expect(result.days[0].transport[0].identifier).toBe("AC1");
    expect(result.days[0].transport[1].identifier).toBe("AC2");
  });

  it("Test 7: multi-leg flight has legCount 2", () => {
    const full = fixture({
      sections: [
        section({
          days: [
            day({
              segments: [
                seg({
                  type: "travel",
                  startTime: "08:00",
                  legs: [
                    { travelMode: "flight", operator: "AC", identifier: "AC1" },
                    { travelMode: "flight", operator: "AC", identifier: "AC2" },
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].transport[0].legCount).toBe(2);
  });

  it("Test 8: train mode maps correctly", () => {
    const full = fixture({
      sections: [
        section({
          days: [
            day({
              segments: [
                seg({ type: "travel", startTime: "09:00", legs: [{ travelMode: "train", operator: "Via", identifier: "V1" }] }),
              ],
            }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].transport[0].mode).toBe("train");
  });

  it("Test 9: null startTime sorts last", () => {
    const full = fixture({
      sections: [
        section({
          days: [
            day({
              segments: [
                seg({ id: 1, type: "travel", startTime: null, legs: [{ travelMode: "bus", operator: "B", identifier: "B1" }] }),
                seg({ id: 2, type: "travel", startTime: "10:00", legs: [{ travelMode: "flight", operator: "F", identifier: "F1" }] }),
              ],
            }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].transport.length).toBe(2);
    expect(result.days[0].transport[0].identifier).toBe("F1");
    expect(result.days[0].transport[1].identifier).toBe("B1");
  });

  it("Test 10: anchor activity is not breakfast", () => {
    const full = fixture({
      sections: [
        section({
          days: [
            day({
              segments: [
                seg({ id: 1, type: "meal", title: "Breakfast", startTime: "08:00" }),
                seg({ id: 2, type: "activity", title: "Museum visit", startTime: "10:00" }),
              ],
            }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].anchorActivity).toBe("Museum visit");
  });

  it("Test 11: no activity segments means no anchor", () => {
    const full = fixture({
      sections: [
        section({
          days: [
            day({
              segments: [
                seg({ type: "meal", title: "Breakfast" }),
                seg({ type: "free_day", title: "Free day" }),
              ],
            }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days[0].anchorActivity).toBeNull();
  });

  it("Test 12: empty day has null stay, empty transport, null anchor", () => {
    const full = fixture({
      sections: [section({ stays: [], days: [day({ segments: [] })] })],
    });
    const result = deriveGlance(full);
    expect(result.days[0].stayName).toBeNull();
    expect(result.days[0].transport).toEqual([]);
    expect(result.days[0].anchorActivity).toBeNull();
  });

  it("Test 13: global day numbering across sections", () => {
    const full = fixture({
      sections: [
        section({
          title: "City A",
          position: 0,
          days: [
            day({ date: "2026-01-01", dayNumber: 1 }),
            day({ date: "2026-01-02", dayNumber: 2 }),
          ],
        }),
        section({
          title: "City B",
          position: 1,
          days: [
            day({ date: "2026-01-03", dayNumber: 1 }),
            day({ date: "2026-01-04", dayNumber: 2 }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(result.days.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4]);
    expect(result.days[0].sectionTitle).toBe("City A");
    expect(result.days[3].sectionTitle).toBe("City B");
  });

  it("Test 14: leakage — no times, addresses, refs in serialized output", () => {
    const full = fixture({
      title: "Trip",
      sections: [
        section({
          stays: [
            stay({
              hotelName: "Grand Hotel",
              address: "123 Main St",
              checkInTime: "15:00",
              notes: "Call ahead to confirm",
            }),
          ],
          days: [
            day({
              date: "2026-01-01",
              segments: [
                seg({
                  type: "activity",
                  title: "Museum",
                  startTime: "09:00",
                  endTime: "17:00",
                  instructions: "Meet at gate",
                  confirmation: "ABC123",
                }),
              ],
            }),
          ],
        }),
      ],
    });
    const result = deriveGlance(full);
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("09:00");
    expect(serialized).not.toContain("17:00");
    expect(serialized).not.toContain("123 Main St");
    expect(serialized).not.toContain("ABC123");
    expect(serialized).not.toContain("Call ahead");
    expect(serialized).not.toContain("Meet at gate");
    expect(serialized).not.toContain("15:00");
  });

  it("Test 15: leakage — output shape is exactly the whitelist", () => {
    const full = fixture({
      sections: [
        section({
          days: [day({ segments: [seg({ type: "activity", title: "Museum" })] })],
        }),
      ],
    });
    const result = deriveGlance(full);
    expect(Object.keys(result).sort()).toEqual(["days", "itineraryTitle"]);
    expect(Object.keys(result.days[0]).sort()).toEqual([
      "anchorActivity",
      "date",
      "dayNumber",
      "sectionTitle",
      "stayName",
      "transport",
    ]);
  });
});
