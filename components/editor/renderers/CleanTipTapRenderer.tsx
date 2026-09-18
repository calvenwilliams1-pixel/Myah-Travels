import DOMPurify from "isomorphic-dompurify";
import React from "react";
import { getSchema } from "@tiptap/core";
import { DOMSerializer, Node as PMNode } from "prosemirror-model";
import { buildExtensions, PURIFY_CONFIG } from "@/lib/editor/extensions";

interface CleanTipTapRendererProps {
  content: string;
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

function serializeJsonToHtml(json: any): string {
  const pmDoc = PMNode.fromJSON(RENDER_SCHEMA, json);
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
    const json = typeof content === "string" ? JSON.parse(content) : content;
    html = serializeJsonToHtml(json);
  } catch (err) {
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
