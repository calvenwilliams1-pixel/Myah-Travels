import React from "react";
import {
  loadTemplatesFromDb,
  loadDbTemplateSlugs,
  countPostsUsingTemplate,
} from "@/lib/blocks/template-store";
import { STARTER_TEMPLATES } from "@/lib/blocks/templates";
import { saveTemplateAction, deleteTemplateAction } from "./actions";
import TemplateCreator from "@/components/editor/TemplateCreator";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await loadTemplatesFromDb();
  const dbSlugs = await loadDbTemplateSlugs();

  const starterIds = STARTER_TEMPLATES.map((t) => t.id);
  const resettableIds = starterIds.filter((id) => dbSlugs.includes(id));

  const postCounts: Record<string, number> = {};
  for (const t of templates) {
    postCounts[t.id] = await countPostsUsingTemplate(t.id);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Template Manager</h1>
      <TemplateCreator
        initialTemplates={templates}
        postCounts={postCounts}
        resettableIds={resettableIds}
        starterIds={starterIds}
        onSave={saveTemplateAction}
        onDelete={deleteTemplateAction}
      />
    </div>
  );
}
