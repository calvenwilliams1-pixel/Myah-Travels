import { db } from "@/lib/db";
import { templates } from "@/drizzle/schema/templates";
import { eq } from "drizzle-orm";
import { Template } from "@/types/blocks";
import { STARTER_TEMPLATES } from "./templates";

export interface StoredTemplateMetadata {
  version: number;
  name: string;
  description: string;
  themeVariant: "minimal" | "travel" | "review";
  sections: Template["sections"];
}

export async function saveTemplateToDb(template: Template): Promise<number> {
  const metadata: StoredTemplateMetadata = {
    version: 1,
    name: template.name,
    description: template.description,
    themeVariant: template.themeVariant || "minimal",
    sections: template.sections,
  };

  const existing = await db
    .select()
    .from(templates)
    .where(eq(templates.slug, template.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(templates)
      .set({
        name: template.name,
        layoutData: JSON.stringify(metadata),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(templates.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(templates).values({
    name: template.name,
    slug: template.id,
    contentType: "post",
    layoutData: JSON.stringify(metadata),
    version: 1,
    isBuiltIn: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return Number(result.lastInsertRowid);
}

export async function loadTemplatesFromDb(): Promise<Template[]> {
  const result = await db
    .select()
    .from(templates)
    .where(eq(templates.contentType, "post"));

  const dbTemplates: Template[] = result.map((t) => {
    try {
      const parsed = JSON.parse(t.layoutData) as StoredTemplateMetadata;
      return {
        id: t.slug,
        name: t.name,
        description: parsed.description || t.name,
        sections: parsed.sections,
        themeVariant: parsed.themeVariant || "minimal",
      };
    } catch {
      return {
        id: t.slug,
        name: t.name,
        description: t.name,
        sections: [],
        themeVariant: "minimal",
      };
    }
  });

  const starterIds = new Set(STARTER_TEMPLATES.map((t) => t.id));
  const dbIds = new Set(dbTemplates.map((t) => t.id));

  const overriddenStarters = STARTER_TEMPLATES.map((starter) => {
    const dbOverride = dbTemplates.find((t) => t.id === starter.id);
    return dbOverride || starter;
  });

  const customTemplates = dbTemplates.filter((t) => !starterIds.has(t.id));

  return [...overriddenStarters, ...customTemplates];
}

export async function deleteTemplateFromDb(templateId: string): Promise<void> {
  await db.delete(templates).where(eq(templates.slug, templateId));
}
