import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import TemplateCreator from "@/components/editor/TemplateCreator";
import { STARTER_TEMPLATES } from "@/lib/blocks/templates";
import type { Template } from "@/types/blocks";

// The unified Template Manager (Cal, 2026-11-24): one place to
// create, edit and manage templates, built on arrangements and
// sample-filled blocks instead of the old allowed/maximum rules form.
const CUSTOM: Template = {
  id: "beach-trip",
  name: "Beach Trip",
  description: "For resort weeks",
  themeVariant: "travel",
  sections: [],
  layout: ["title", "hero", "body"],
};

function renderManager(templates: Template[] = [...STARTER_TEMPLATES, CUSTOM]) {
  const onSave = vi.fn(async () => ({ ok: true as const, id: "new-template" }));
  const onDelete = vi.fn(async () => ({ ok: true as const }));
  render(
    <TemplateCreator
      initialTemplates={templates}
      postCounts={{ "beach-trip": 2, story: 0 }}
      resettableIds={[]}
      starterIds={STARTER_TEMPLATES.map((t) => t.id)}
      onSave={onSave}
      onDelete={onDelete}
    />
  );
  return { onSave, onDelete };
}

describe("TemplateManager list", () => {
  it("lists templates with their arrangement and post counts", () => {
    renderManager();
    expect(screen.getByText("Beach Trip")).toBeTruthy();
    expect(screen.getByText("Used by 2 posts")).toBeTruthy();
    expect(screen.getByText("Story")).toBeTruthy();
    expect(screen.getAllByText(/Built-in/).length).toBeGreaterThanOrEqual(1);
  });

  it("has no rules form anywhere", () => {
    renderManager();
    expect(screen.queryByText(/Allowed Blocks/)).toBeNull();
    expect(screen.queryByText(/^Max$/)).toBeNull();
  });

  it("blocks Delete in plain words while posts use a template", () => {
    renderManager();
    expect(
      screen.getByText(/Delete is off while posts use this template/)
    ).toBeTruthy();
  });
});

describe("TemplateManager builder", () => {
  it("opens with a block menu and an empty arrangement", () => {
    renderManager();
    fireEvent.click(screen.getByText("+ New template"));
    expect(screen.getByText("Add a block")).toBeTruthy();
    expect(screen.getByText(/Nothing here yet/)).toBeTruthy();
    expect(screen.queryByText(/Allowed Blocks/)).toBeNull();
  });

  it("adds sample-filled blocks and shows them in the preview", () => {
    renderManager();
    fireEvent.click(screen.getByText("+ New template"));
    fireEvent.click(screen.getByText(/Title/));
    // The sample title shows in the arrangement row and in the preview.
    expect(screen.getAllByText("Two weeks in Punta Cana").length).toBeGreaterThanOrEqual(2);
  });

  it("reorders blocks with the arrow buttons", () => {
    renderManager();
    fireEvent.click(screen.getByText("+ New template"));
    fireEvent.click(screen.getByText(/Title/));
    fireEvent.click(screen.getByText(/Hero Image/));
    const rows = () =>
      screen
        .getAllByLabelText(/Move .* down/)
        .map((el) => el.getAttribute("aria-label")?.replace("Move ", "").replace(" down", ""));
    expect(rows()).toEqual(["Title", "Hero Image"]);
    fireEvent.click(screen.getByLabelText("Move Title down"));
    expect(rows()).toEqual(["Hero Image", "Title"]);
  });

  it("editing a template opens its arrangement as sample blocks", () => {
    renderManager();
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[editButtons.length - 1]);
    expect(screen.getByDisplayValue("Beach Trip")).toBeTruthy();
    expect(screen.getAllByText("Two weeks in Punta Cana").length).toBeGreaterThanOrEqual(1);
  });
});
