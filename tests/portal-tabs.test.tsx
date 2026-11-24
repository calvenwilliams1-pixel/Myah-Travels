import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/portals/7/notepad",
}));

import PortalTabs from "@/components/admin/portals/PortalTabs";

// R3 pins: the strip holds exactly the four portal sections, each
// linking to the screen that already lived at that URL.
describe("PortalTabs (R3)", () => {
  it("renders the four tabs with their existing destinations", () => {
    render(<PortalTabs portalId={7} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => [l.textContent, l.getAttribute("href")])).toEqual([
      ["Members", "/admin/portals/7"],
      ["Wall", "/admin/portals/7/edit"],
      ["Itinerary", "/admin/portals/7/itinerary"],
      ["Notepad", "/admin/portals/7/notepad"],
    ]);
  });

  it("marks the current section as the active tab", () => {
    render(<PortalTabs portalId={7} />);
    expect(screen.getByText("Notepad").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Members").getAttribute("aria-current")).toBeNull();
  });
});
