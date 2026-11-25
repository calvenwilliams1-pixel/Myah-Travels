import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// The form's server actions pull in the settings store (React cache),
// which does not exist under vitest; the actions are not what is
// being tested here.
vi.mock("@/app/admin/(dashboard)/homepage/actions", () => ({
  saveWelcomeSettings: vi.fn(),
  saveHomepageCanvas: vi.fn(),
}));

import WelcomeSettingsForm from "@/app/admin/(dashboard)/homepage/WelcomeSettingsForm";
import { WELCOME_TEMPLATES, type WelcomeContent } from "@/lib/welcome";

// Cal, 2026-11-24: the canvas editor is hidden from the Homepage
// Editor (not deleted), and the welcome photo is a real upload
// instead of a pasted address. These tests pin both.
const CONTENT: WelcomeContent = {
  photo: "/images/welcome-banner.jpg",
  heading: "Welcome to MyCalTravels",
  text: "Trips planned with care.",
  buttonLabel: "Plan my trip",
  buttonHref: "/contact",
};

describe("WelcomeSettingsForm (canvas hidden, photo upload)", () => {
  it("shows no canvas option and no mode switch", () => {
    const { container } = render(
      <WelcomeSettingsForm
        initialTemplate="banner"
        initialContent={CONTENT}
        contentSource="stored"
      />
    );
    expect(screen.queryByText(/Canvas editor/)).toBeNull();
    expect(screen.queryByText(/freeform/)).toBeNull();
    expect(container.querySelector('input[name="welcome-mode"]')).toBeNull();
  });

  it("offers every designed layout", () => {
    render(
      <WelcomeSettingsForm
        initialTemplate="banner"
        initialContent={CONTENT}
        contentSource="stored"
      />
    );
    for (const t of WELCOME_TEMPLATES) {
      expect(screen.getByText(t.name)).toBeTruthy();
    }
  });

  it("has a photo upload control and shows Replace when a photo is set", () => {
    const { container } = render(
      <WelcomeSettingsForm
        initialTemplate="banner"
        initialContent={CONTENT}
        contentSource="stored"
      />
    );
    const fileInput = container.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
    expect(fileInput?.getAttribute("accept")).toBe("image/*");
    expect(screen.getByText("Replace photo")).toBeTruthy();
    // No address field to paste into any more.
    expect(screen.queryByPlaceholderText("/images/welcome-banner.jpg")).toBeNull();
  });

  it("shows Upload a photo when no photo is set yet", () => {
    render(
      <WelcomeSettingsForm
        initialTemplate="banner"
        initialContent={{ ...CONTENT, photo: "" }}
        contentSource="stored"
      />
    );
    expect(screen.getByText("Upload a photo")).toBeTruthy();
  });
});
