import { describe, it, expect } from "vitest";
import { tripSummaryStrip } from "./tripSummary";

describe("tripSummaryStrip", () => {
  it("renders the mixed-trip example from the scope", () => {
    const strip = tripSummaryStrip([
      {
        baseCity: "Toronto",
        stays: [
          { hotelName: "Fairmont Royal York", kind: "hotel", checkInDate: "2027-03-01", checkOutDate: "2027-03-04" },
        ],
      },
      {
        baseCity: "Miami",
        stays: [
          { hotelName: "Symphony of the Seas", kind: "cruise", checkInDate: "2027-03-04", checkOutDate: "2027-03-11" },
        ],
      },
      {
        baseCity: "Cancún",
        stays: [
          { hotelName: "Secrets Playa Blanca", kind: "resort", checkInDate: "2027-03-11", checkOutDate: "2027-03-13" },
        ],
      },
    ]);
    expect(strip).toBe(
      "3 nights Toronto · 7 nights aboard Symphony of the Seas · 2 nights Cancún resort"
    );
  });

  it("falls back to property names without a base city, singularizes one night", () => {
    const strip = tripSummaryStrip([
      {
        baseCity: null,
        stays: [
          { hotelName: "Ryokan Hana", kind: "hotel", checkInDate: "2027-04-01", checkOutDate: "2027-04-02" },
          { hotelName: "Beach House", kind: "resort", checkInDate: "2027-04-02", checkOutDate: "2027-04-05" },
        ],
      },
    ]);
    expect(strip).toBe("1 night Ryokan Hana · 3 nights Beach House");
  });

  it("returns null when there are no usable stays", () => {
    expect(tripSummaryStrip([])).toBeNull();
    expect(tripSummaryStrip([{ baseCity: "X", stays: [] }])).toBeNull();
  });
});
