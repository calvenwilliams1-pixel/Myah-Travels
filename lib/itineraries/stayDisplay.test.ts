import { describe, it, expect } from "vitest";
import { stayKindIcon, staySleepName, staySubline } from "./stayDisplay";

describe("stayDisplay", () => {
  it("icons per kind, hotel as the default", () => {
    expect(stayKindIcon("hotel")).toBe("🏨");
    expect(stayKindIcon("resort")).toBe("🏝️");
    expect(stayKindIcon("cruise")).toBe("🚢");
    expect(stayKindIcon(null)).toBe("🏨");
    expect(stayKindIcon(undefined)).toBe("🏨");
  });

  it("a ship sleeps 'Aboard …'; other kinds use the plain name", () => {
    expect(staySleepName({ hotelName: "Icon of the Seas", kind: "cruise" })).toBe(
      "Aboard Icon of the Seas"
    );
    expect(staySleepName({ hotelName: "Sandals Royal", kind: "resort" })).toBe("Sandals Royal");
  });

  it("subline is the cruise line or the resort brand", () => {
    expect(
      staySubline({ hotelName: "Icon", kind: "cruise", cruiseLine: "Royal Caribbean" })
    ).toBe("Royal Caribbean");
    expect(
      staySubline({ hotelName: "Sandals Royal", kind: "resort", resortBrand: "Sandals Resorts" })
    ).toBe("Sandals Resorts");
    expect(staySubline({ hotelName: "Hilton", kind: "hotel" })).toBeNull();
  });
});
