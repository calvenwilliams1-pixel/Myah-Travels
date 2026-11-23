import { describe, it, expect, afterEach } from "vitest";
import { db } from "@/lib/db";
import { templates } from "@/drizzle/schema/templates";
import { eq } from "drizzle-orm";
import { saveTemplateToDb, loadTemplatesFromDb } from "./template-store";
import { sectionsFromLayout } from "./layout";
import type { Template } from "@/types/blocks";

const runId = Date.now().toString(36);
const slug = `layout-test-${runId}`;

afterEach(async () => {
  await db.delete(templates).where(eq(templates.slug, slug));
});

describe("template layout round-trip", () => {
  it("a layout saved with a template comes back on load", async () => {
    const layout = ["title", "hero", "body", "quote", "body"] as Template["layout"];
    await saveTemplateToDb({
      id: slug,
      name: `Layout Test ${runId}`,
      description: "",
      themeVariant: "minimal",
      sections: sectionsFromLayout(layout!),
      layout,
    });

    const all = await loadTemplatesFromDb();
    const mine = all.find((t) => t.id === slug);
    expect(mine).toBeDefined();
    expect(mine!.layout).toEqual(["title", "hero", "body", "quote", "body"]);
    expect(mine!.sections.map((s) => s.type)).toEqual(["title", "hero", "body", "quote"]);
  });

  it("a template saved without a layout loads with no layout", async () => {
    await saveTemplateToDb({
      id: slug,
      name: `Layout Test ${runId}`,
      description: "",
      themeVariant: "minimal",
      sections: sectionsFromLayout(["title", "body"]),
    });

    const all = await loadTemplatesFromDb();
    const mine = all.find((t) => t.id === slug);
    expect(mine).toBeDefined();
    expect(mine!.layout).toBeUndefined();
  });
});
