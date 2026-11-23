import { describe, it, expect, afterAll } from "vitest";
import { db } from "@/lib/db";
import { portals } from "@/drizzle/schema/portals";
import { itineraries, itinerarySections } from "@/drizzle/schema/itineraries";
import { eq } from "drizzle-orm";
import { createStay, getDaysForSection, getSegmentsForDay, createSegment } from "./index";
import { layoutSailingDays } from "./sailing";
import { sailingDayTitle, portLineFromTitle } from "./sailingTitles";

// DB-backed: real local DB, unique-per-run fixtures, cleaned up after.
const runId = Date.now().toString(36);
let portalId = 0;
let itineraryId = 0;
let sectionId = 0;
let stayId = 0;

async function setup() {
  const [portal] = await db
    .insert(portals)
    .values({ name: `Sailing Test ${runId}`, slug: `sailing-test-${runId}` })
    .returning();
  portalId = portal.id;
  const [itin] = await db
    .insert(itineraries)
    .values({ portalId, title: `Sailing Test ${runId}` })
    .returning();
  itineraryId = itin.id;
  const [section] = await db
    .insert(itinerarySections)
    .values({ itineraryId, title: "Cruise" })
    .returning();
  sectionId = section.id;
  const [stay] = await createStay(sectionId, {
    hotelName: "Test Ship",
    kind: "cruise",
    cruiseLine: "Test Line",
    checkInDate: "2027-02-01",
    checkOutDate: "2027-02-05", // 4 nights → 5 lines
  });
  stayId = stay.id;
}

describe("sailingDayTitle", () => {
  it("labels embark, ports, sea days and disembark", () => {
    expect(sailingDayTitle("Miami", 0, 5)).toBe("Embark — Miami");
    expect(sailingDayTitle("Nassau", 2, 5)).toBe("Nassau");
    expect(sailingDayTitle("At sea", 3, 5)).toBe("At Sea");
    expect(sailingDayTitle("sea day", 3, 5)).toBe("At Sea");
    expect(sailingDayTitle("Miami", 4, 5)).toBe("Disembark — Miami");
  });

  it("round-trips titles back to port lines for the prefill", () => {
    expect(portLineFromTitle("Embark — Miami")).toBe("Miami");
    expect(portLineFromTitle("Disembark — Miami")).toBe("Miami");
    expect(portLineFromTitle("At Sea")).toBe("At sea");
    expect(portLineFromTitle("Nassau")).toBe("Nassau");
    expect(portLineFromTitle(null)).toBe("");
  });
});

describe("layoutSailingDays", () => {
  it("builds the days, then re-lays without touching segments", async () => {
    await setup();

    const ports = ["Miami, Florida", "At sea", "Nassau, Bahamas", "At sea", "Miami, Florida"];
    const first = await layoutSailingDays(sectionId, stayId, ports);
    expect(first.created).toBe(5);
    expect(first.retitled).toBe(0);

    let days = await getDaysForSection(sectionId);
    expect(days.map((d) => d.date)).toEqual([
      "2027-02-01",
      "2027-02-02",
      "2027-02-03",
      "2027-02-04",
      "2027-02-05",
    ]);
    expect(days.map((d) => d.title)).toEqual([
      "Embark — Miami, Florida",
      "At Sea",
      "Nassau, Bahamas",
      "At Sea",
      "Disembark — Miami, Florida",
    ]);
    expect(days.map((d) => d.dayNumber)).toEqual([1, 2, 3, 4, 5]);

    // She adds work to a day; a re-lay with a changed port must keep it.
    const nassauDay = days[2];
    await createSegment(nassauDay.id, {
      type: "activity",
      title: "Straw Market",
    } as any);

    const second = await layoutSailingDays(sectionId, stayId, [
      "Miami, Florida",
      "At sea",
      "Freeport, Bahamas",
      "At sea",
      "Miami, Florida",
    ]);
    expect(second.created).toBe(0);
    expect(second.retitled).toBe(1);

    days = await getDaysForSection(sectionId);
    expect(days[2].title).toBe("Freeport, Bahamas");
    const segments = await getSegmentsForDay(days[2].id);
    expect(segments.map((s) => s.title)).toContain("Straw Market");
  });

  it("rejects a list with the wrong number of lines", async () => {
    await expect(
      layoutSailingDays(sectionId, stayId, ["Miami", "Nassau"])
    ).rejects.toThrow(/needs 5 lines/);
  });

  it("rejects a blank line in the middle", async () => {
    await expect(
      layoutSailingDays(sectionId, stayId, ["Miami", "", "Nassau", "At sea", "Miami"])
    ).rejects.toThrow(/Line 2 is blank/);
  });
});

afterAll(async () => {
  if (portalId) await db.delete(portals).where(eq(portals.id, portalId));
});
