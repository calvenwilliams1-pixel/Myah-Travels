import React from "react";
import { getAllTemplates } from "@/lib/blocks/templates";
import { saveTemplateToDb, deleteTemplateFromDb, loadTemplatesFromDb } from "@/lib/blocks/template-store";
import TemplateCreator from "@/components/editor/TemplateCreator";
import { Template } from "@/types/blocks";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await loadTemplatesFromDb();

  async function handleSave(template: Template): Promise<void> {
    "use server";
    await saveTemplateToDb(template);
  }

  async function handleDelete(templateId: string): Promise<void> {
    "use server";
    await deleteTemplateFromDb(templateId);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Template Creator</h1>
      <TemplateCreator
        initialTemplates={templates}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
