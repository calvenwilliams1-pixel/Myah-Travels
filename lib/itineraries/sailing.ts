import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { itineraryDays } from "@/drizzle/schema/itineraries";
import {
  getStayById,
  getSectionById,
  getDaysForSection,
  createDay,
  updateDay,
} from "./index";
import { addDaysToISODate, daysBetweenISODate } from "./dates";
import { sailingDayTitle } from "./sailingTitles";

/**
 * Phase 8 Batch 2 — "Lay out sailing days."
 *
 * A cruise stay knows its sailing dates (check-in = embark, check-out =
 * disembark). Given the port list in sailing order — one line per day,
 * embark day through disembark day, "At sea" for sea days — build or
 * retitle the section's days to match. Segments she has already added
 * to those days are never touched; only day rows and their titles.
 */

export interface SailingLayoutResult {
  created: number;
  retitled: number;
}

export async function layoutSailingDays(
  sectionId: number,
  stayId: number,
  ports: string[]
): Promise<SailingLayoutResult> {
  const stay = await getStayById(stayId);
  if (!stay) throw new Error("Stay not found");
  if (stay.sectionId !== sectionId) {
    throw new Error("That stay does not belong to this section");
  }
  if (stay.kind !== "cruise") {
    throw new Error("Sailing days can only be laid out for a cruise stay");
  }

  const nights = daysBetweenISODate(stay.checkInDate, stay.checkOutDate);
  if (nights === null || nights < 1) {
    throw new Error("The cruise stay needs valid embark and disembark dates first");
  }
  const expected = nights + 1;
  const lines = ports.map((p) => p.trim());
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  if (lines.length !== expected) {
    throw new Error(
      `This sailing is ${nights} night${nights === 1 ? "" : "s"}, so the list needs ${expected} lines — one per day from embark to disembark — but ${lines.length} were given.`
    );
  }
  const blankAt = lines.findIndex((l) => l === "");
  if (blankAt >= 0) {
    throw new Error(
      `Line ${blankAt + 1} is blank — every day needs a port name or "At sea".`
    );
  }

  const section = await getSectionById(sectionId);
  if (!section) throw new Error("Section not found");

  const existing = await getDaysForSection(sectionId);
  const byDate = new Map(existing.map((d) => [d.date, d]));

  let created = 0;
  let retitled = 0;
  let nextNumber =
    existing.reduce((max, d) => Math.max(max, d.dayNumber ?? 0), 0) + 1;

  for (let i = 0; i < lines.length; i++) {
    const date = addDaysToISODate(stay.checkInDate, i);
    if (!date) throw new Error("Could not compute the sailing dates");
    const title = sailingDayTitle(lines[i], i, lines.length);
    const day = byDate.get(date);
    if (day) {
      if (day.title !== title) {
        await updateDay(day.id, { title });
        retitled++;
      }
    } else {
      // createDay throws if the date already exists in another section —
      // that message is the right one to surface.
      await createDay(sectionId, { date, dayNumber: nextNumber++, title });
      created++;
    }
  }

  // Renumber the section's days by date so "Day N" follows the sailing.
  const all = await getDaysForSection(sectionId);
  const sorted = [...all].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].dayNumber !== i + 1) {
      await db
        .update(itineraryDays)
        .set({ dayNumber: i + 1 })
        .where(eq(itineraryDays.id, sorted[i].id));
    }
  }

  return { created, retitled };
}
