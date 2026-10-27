import React from "react";
import { getEditorTemplates } from "@/lib/blocks/template-store";
import EditPostForm from "./EditPostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: {
  params: { id: string };
}) {
  const templates = await getEditorTemplates();
  const postId = Number(params.id);

  if (Number.isNaN(postId)) {
    return <div className="p-6 text-red-600">Invalid post ID</div>;
  }

  return <EditPostForm postId={postId} templates={templates} />;
}
