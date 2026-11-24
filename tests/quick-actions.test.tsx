import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import QuickActions from "@/app/admin/(dashboard)/components/QuickActions";

// R2 pins: at most five job buttons, labelled with the job in plain
// words, each linking to a screen that already exists.
describe("QuickActions (R2 job buttons)", () => {
  it("renders exactly five job buttons with their destinations", () => {
    render(<QuickActions />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
    expect(links.map((l) => l.getAttribute("href"))).toEqual([
      "/admin/posts/new",
      "/admin/portals/new",
      "/admin/portals",
      "/admin/itineraries",
      "/admin/settings/email",
    ]);
  });

  it("labels the buttons with the job, not the screen name", () => {
    render(<QuickActions />);
    for (const label of [
      "Write a post",
      "Start a portal",
      "Add a traveller",
      "Build an itinerary",
      "Did the invite go out?",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText(/Template Manager/)).toBeNull();
  });
});
