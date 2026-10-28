import React from "react";
import { loadTemplatesFromDb } from "@/lib/blocks/template-store";
import { saveTemplateAction, deleteTemplateAction } from "./actions";
import TemplateCreator from "@/components/editor/TemplateCreator";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await loadTemplatesFromDb();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Template Creator</h1>
      <TemplateCreator
        initialTemplates={templates}
        onSave={saveTemplateAction}
        onDelete={deleteTemplateAction}
      />
    </div>
  );
}
