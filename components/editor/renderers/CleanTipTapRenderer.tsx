import DOMPurify from "isomorphic-dompurify";
import React from "react";
import { getSchema } from "@tiptap/core";
import { DOMSerializer, Node as PMNode } from "prosemirror-model";
import { buildExtensions, PURIFY_CONFIG } from "@/lib/editor/extensions";

interface CleanTipTapRendererProps {
  /**
   * TipTap JSON — already parsed, not a string. The caller is
   * responsible for any storage unwrapping (see
   * `lib/editor/body-content.ts`). This component's only job is to
   * turn TipTap JSON into HTML.
   */
  content: unknown;
}

// Build schema + serializer once at module load. These are pure data
// structures — no DOM, no Editor instance.
const RENDER_EXTENSIONS = buildExtensions();
const RENDER_SCHEMA = getSchema(RENDER_EXTENSIONS);
const RENDER_SERIALIZER = DOMSerializer.fromSchema(RENDER_SCHEMA);

// Resolve a DOM document for serialization. On the server there is no
// global `document`, so we lazily construct a detached one via jsdom.
// On the client the global is used directly.
function getDocument(): Document {
  if (typeof document !== "undefined") {
    return document;
  }
  // Server path. Lazy-require jsdom so the client bundle never pulls it.
  const { JSDOM } = require("jsdom");
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
  return dom.window.document;
}

function serializeJsonToHtml(json: unknown): string {
  const pmDoc = PMNode.fromJSON(RENDER_SCHEMA, json as any);
  const doc = getDocument();
  const fragment = RENDER_SERIALIZER.serializeFragment(pmDoc.content, {
    document: doc,
  });
  const container = doc.createElement("div");
  container.appendChild(fragment);
  return container.innerHTML;
}

export default function CleanTipTapRenderer({ content }: CleanTipTapRendererProps) {
  if (!content) {
    return null;
  }

  let html = "";

  try {
    html = serializeJsonToHtml(content);
  } catch (err) {
    // Log server-side too — a silent failure here is exactly the class
    // of bug that leaks raw content into the DOM.
    console.error("[CleanTipTapRenderer] render failed:", err);
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
