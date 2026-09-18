import DOMPurify from "isomorphic-dompurify";
import React from "react";
import { generateHTML } from "@tiptap/html";
import { buildExtensions, PURIFY_CONFIG } from "@/lib/editor/extensions";

interface CleanTipTapRendererProps {
  content: string;
}

// Shared extension set — see lib/editor/extensions.ts. Does NOT include
// CanvasBlockNode: body blocks never contain canvas nodes.
const RENDER_EXTENSIONS = buildExtensions({
  includeCanvasBlock: false,
});

export default function CleanTipTapRenderer({ content }: CleanTipTapRendererProps) {
  if (!content) {
    return null;
  }

  let html = "";

  try {
    const json = typeof content === "string" ? JSON.parse(content) : content;
    html = generateHTML(json, RENDER_EXTENSIONS);
  } catch (err) {
    // Log server-side too — this component runs under SSR and a silent
    // failure here is exactly the class of bug that leaks raw JSON.
    console.error("[CleanTipTapRenderer] generateHTML failed:", err);
    html = "";
  }

  if (!html) {
    return null;
  }

  return (
    <div
      className="prose prose-sm sm:prose-base max-w-none"
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, PURIFY_CONFIG) }}
    />
  );
}
