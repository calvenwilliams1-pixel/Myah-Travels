import { describe, it, expect, vi, beforeEach } from "vitest";
import { attachGlancesToItems } from "./attach-glances";
import * as itinerariesModule from "./index";

vi.mock("./index", () => ({
  getFullItinerary: vi.fn(),
}));

const mockGetFull = itinerariesModule.getFullItinerary as unknown as ReturnType<typeof vi.fn>;

function minimalFullItinerary(): any {
  return {
    id: 1,
    title: "Trip",
    sections: [
      {
        id: 1,
        itineraryId: 1,
        title: "Section",
        position: 0,
        days: [
          {
            id: 1,
            sectionId: 1,
            date: "2026-01-01",
            dayNumber: 1,
            orderMode: "time",
            segments: [],
            blocks: [],
          },
        ],
        stays: [],
      },
    ],
  };
}

describe("attachGlancesToItems", () => {
  beforeEach(() => {
    mockGetFull.mockReset();
  });

  it("Test 16a: valid glance item gets glance data", async () => {
    mockGetFull.mockResolvedValue(minimalFullItinerary());
    const items = [
      { id: 1, sourceType: "itinerary", itineraryId: 1, variant: "glance" },
    ];
    const result = await attachGlancesToItems(items);
    expect(result[0].glance).toBeDefined();
    expect(result[0].glanceError).toBeUndefined();
  });

  it("Test 16b: missing itinerary sets glanceError, no glance", async () => {
    mockGetFull.mockResolvedValue(null);
    const items = [
      { id: 2, sourceType: "itinerary", itineraryId: 99, variant: "glance" },
    ];
    const result = await attachGlancesToItems(items);
    expect(result[0].glance).toBeUndefined();
    expect(result[0].glanceError).toBe(true);
  });

  it("Test 16c: null itineraryId sets glanceError", async () => {
    const items = [
      { id: 3, sourceType: "itinerary", itineraryId: null, variant: "glance" },
    ];
    const result = await attachGlancesToItems(items);
    expect(result[0].glance).toBeUndefined();
    expect(result[0].glanceError).toBe(true);
  });

  it("Test 16d: derive throw sets glanceError, no throw propagates", async () => {
    mockGetFull.mockRejectedValue(new Error("boom"));
    const items = [
      { id: 4, sourceType: "itinerary", itineraryId: 1, variant: "glance" },
    ];
    const result = await attachGlancesToItems(items);
    expect(result[0].glance).toBeUndefined();
    expect(result[0].glanceError).toBe(true);
  });

  it("Test 16e: non-glance items returned unchanged", async () => {
    const items = [
      { id: 5, sourceType: "itinerary", itineraryId: 1, variant: "full" },
      { id: 6, sourceType: "library", variant: null },
    ];
    const result = await attachGlancesToItems(items);
    expect(result[0]).toEqual(items[0]);
    expect(result[1]).toEqual(items[1]);
    expect(mockGetFull).not.toHaveBeenCalled();
  });

  it("Test 16f: one failing item does not block others", async () => {
    mockGetFull
      .mockResolvedValueOnce(minimalFullItinerary())  // item 7 valid
      .mockRejectedValueOnce(new Error("boom"));      // item 8 fails
    const items = [
      { id: 7, sourceType: "itinerary", itineraryId: 1, variant: "glance" },
      { id: 8, sourceType: "itinerary", itineraryId: 2, variant: "glance" },
    ];
    const result = await attachGlancesToItems(items);
    expect(result[0].glance).toBeDefined();
    expect(result[0].glanceError).toBeUndefined();
    expect(result[1].glance).toBeUndefined();
    expect(result[1].glanceError).toBe(true);
  });
});
