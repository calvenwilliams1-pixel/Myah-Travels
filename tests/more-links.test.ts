import { describe, it, expect } from "vitest";
import { getMoreGroups } from "@/components/admin/more-groups";

// R4 link parity: every destination in the old 12-link header must
// survive the shrink. Home (/admin) and View Site (/) stay in the
// header itself; the other ten, plus the Guide, live on More.
const OLD_HEADER_INTERNAL = [
  "/admin/posts",
  "/admin/homepage",
  "/admin/templates",
  "/admin/media",
  "/admin/content-library",
  "/admin/clients",
  "/admin/portals",
  "/admin/itineraries",
  "/admin/settings",
  "/admin/guide",
];

function allHrefs(showGuide: boolean): string[] {
  return getMoreGroups(showGuide).flatMap((g) => g.links.map((l) => l.href));
}

describe("More page link parity (R4)", () => {
  it("groups are Clients, Content, Setup, in that order", () => {
    expect(getMoreGroups(true).map((g) => g.heading)).toEqual(["Clients", "Content", "Setup"]);
  });

  it("every old header destination is on More while the guide is active", () => {
    const hrefs = allHrefs(true);
    for (const href of OLD_HEADER_INTERNAL) {
      expect(hrefs).toContain(href);
    }
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("without the guide, only the Guide tile is missing", () => {
    const hrefs = allHrefs(false);
    expect(hrefs).not.toContain("/admin/guide");
    for (const href of OLD_HEADER_INTERNAL.filter((h) => h !== "/admin/guide")) {
      expect(hrefs).toContain(href);
    }
  });
});
