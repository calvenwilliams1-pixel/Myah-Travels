import { describe, it, expect, vi, beforeEach } from "vitest";
import { attachDerivedItems } from "./attach-derived-items";
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
        id: 1, itineraryId: 1, title: "Section", position: 0,
        days: [{ id: 1, sectionId: 1, date: "2026-01-01", dayNumber: 1, orderMode: "time", segments: [], blocks: [] }],
        stays: [],
      },
    ],
  };
}

describe("attachDerivedItems", () => {
  beforeEach(() => {
    mockGetFull.mockReset();
  });

  it("itinerary_glance item gets glance data", async () => {
    mockGetFull.mockResolvedValue(minimalFullItinerary());
    const items = [{ id: 1, sourceType: "itinerary_glance", itineraryId: 1 }];
    const result = await attachDerivedItems(items);
    expect(result[0].glance).toBeDefined();
    expect(result[0].derivedError).toBeUndefined();
  });

  it("itinerary (full) item passes through unchanged", async () => {
    const items = [{ id: 2, sourceType: "itinerary", itineraryId: 1 }];
    const result = await attachDerivedItems(items);
    expect(result[0]).toEqual(items[0]);
    expect(mockGetFull).not.toHaveBeenCalled();
  });

  it("library item passes through unchanged", async () => {
    const items = [{ id: 3, sourceType: "library", itineraryId: null }];
    const result = await attachDerivedItems(items);
    expect(result[0]).toEqual(items[0]);
    expect(mockGetFull).not.toHaveBeenCalled();
  });

  it("portal_specific item passes through unchanged", async () => {
    const items = [{ id: 4, sourceType: "portal_specific" }];
    const result = await attachDerivedItems(items);
    expect(result[0]).toEqual(items[0]);
  });

  it("unknown source_type passes through unchanged", async () => {
    const items = [{ id: 5, sourceType: "future_type", itineraryId: 1 }];
    const result = await attachDerivedItems(items);
    expect(result[0]).toEqual(items[0]);
    expect(mockGetFull).not.toHaveBeenCalled();
  });

  it("itinerary_glance with null itineraryId sets derivedError", async () => {
    const items = [{ id: 6, sourceType: "itinerary_glance", itineraryId: null }];
    const result = await attachDerivedItems(items);
    expect(result[0].glance).toBeUndefined();
    expect(result[0].derivedError).toBe(true);
  });

  it("itinerary_glance with missing itinerary sets derivedError", async () => {
    mockGetFull.mockResolvedValue(null);
    const items = [{ id: 7, sourceType: "itinerary_glance", itineraryId: 99 }];
    const result = await attachDerivedItems(items);
    expect(result[0].glance).toBeUndefined();
    expect(result[0].derivedError).toBe(true);
  });

  it("itinerary_glance with thrown derive sets derivedError, no throw propagates", async () => {
    mockGetFull.mockRejectedValue(new Error("boom"));
    const items = [{ id: 8, sourceType: "itinerary_glance", itineraryId: 1 }];
    const result = await attachDerivedItems(items);
    expect(result[0].glance).toBeUndefined();
    expect(result[0].derivedError).toBe(true);
  });

  it("one failing item does not block others", async () => {
    mockGetFull
      .mockResolvedValueOnce(minimalFullItinerary())
      .mockRejectedValueOnce(new Error("boom"));
    const items = [
      { id: 9, sourceType: "itinerary_glance", itineraryId: 1 },
      { id: 10, sourceType: "itinerary_glance", itineraryId: 2 },
    ];
    const result = await attachDerivedItems(items);
    expect(result[0].glance).toBeDefined();
    expect(result[0].derivedError).toBeUndefined();
    expect(result[1].glance).toBeUndefined();
    expect(result[1].derivedError).toBe(true);
  });
});
