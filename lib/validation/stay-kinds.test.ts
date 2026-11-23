import { describe, it, expect } from "vitest";
import { CreateStaySchema } from "./itinerary";

const base = {
  hotelName: "Somewhere",
  checkInDate: "2026-03-01",
  checkOutDate: "2026-03-05",
};

describe("CreateStaySchema stay kinds", () => {
  it("accepts a plain hotel stay (kind defaults server-side)", () => {
    expect(CreateStaySchema.safeParse(base).success).toBe(true);
  });

  it("accepts a cruise stay with line, cabin, deck and ports", () => {
    const r = CreateStaySchema.safeParse({
      ...base,
      hotelName: "Icon of the Seas",
      kind: "cruise",
      cruiseLine: "Royal Caribbean International",
      cabin: "8254",
      deck: "8",
      embarkPort: "Miami, Florida",
      disembarkPort: "Miami, Florida",
    });
    expect(r.success).toBe(true);
  });

  it("accepts a resort stay with brand, meal plan and transfers", () => {
    const r = CreateStaySchema.safeParse({
      ...base,
      kind: "resort",
      resortBrand: "Sandals Resorts",
      mealPlan: "All-inclusive",
      transfersIncluded: true,
      transfersNote: "Shared shuttle",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    const r = CreateStaySchema.safeParse({ ...base, kind: "villa" });
    expect(r.success).toBe(false);
  });

  it("still rejects check-out before check-in for any kind", () => {
    const r = CreateStaySchema.safeParse({
      ...base,
      kind: "cruise",
      checkInDate: "2026-03-05",
      checkOutDate: "2026-03-01",
    });
    expect(r.success).toBe(false);
  });
});
