import React from "react";
import { getEditorTemplates } from "@/lib/blocks/template-store";
import NewPostForm from "./NewPostForm";
import { saveTemplateAction } from "@/app/admin/(dashboard)/templates/actions";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const templates = await getEditorTemplates();
  return <NewPostForm templates={templates} onSaveAsTemplate={saveTemplateAction} />;
}
