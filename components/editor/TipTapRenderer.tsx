import DOMPurify from "isomorphic-dompurify";
import React from "react";
import { generateHTML } from "@tiptap/html";
import { buildExtensions, PURIFY_CONFIG } from "@/lib/editor/extensions";
import { CanvasBlockNode } from "./CanvasBlockNode";
import CanvasBlockRenderer from "./CanvasBlockRenderer";

// Shared extension set — see lib/editor/extensions.ts.
const RENDER_EXTENSIONS = buildExtensions({
  includeCanvasBlock: true,
  CanvasBlockNode,
});

interface TipTapRendererProps {
  content: string;
}

export default function TipTapRenderer({ content }: TipTapRendererProps) {
  try {
    const json = JSON.parse(content);

    if (json.type !== "doc" || !Array.isArray(json.content)) {
      throw new Error("Invalid TipTap document");
    }

    const chunks: Array<
      | { type: "html"; nodes: any[] }
      | { type: "canvas"; canvasJson: string; templateName: string }
    > = [];

    let currentHtmlNodes: any[] = [];

    for (const node of json.content) {
      if (node.type === "canvasBlock") {
        if (currentHtmlNodes.length > 0) {
          chunks.push({ type: "html", nodes: currentHtmlNodes });
          currentHtmlNodes = [];
        }
        chunks.push({
          type: "canvas",
          canvasJson: node.attrs?.canvasJson || "",
          templateName: node.attrs?.templateName || "",
        });
      } else {
        currentHtmlNodes.push(node);
      }
    }

    if (currentHtmlNodes.length > 0) {
      chunks.push({ type: "html", nodes: currentHtmlNodes });
    }

    if (chunks.length === 0) {
      return null;
    }

    return (
      <div>
        {chunks.map((chunk, index) => {
          if (chunk.type === "canvas") {
            return (
              <CanvasBlockRenderer
                key={index}
                canvasJson={chunk.canvasJson}
                templateName={chunk.templateName}
              />
            );
          }

          const html = generateHTML(
            { type: "doc", content: chunk.nodes },
            RENDER_EXTENSIONS
          );

          return (
            <div
              key={index}
              className="prose prose-sm sm:prose-base max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, PURIFY_CONFIG) }}
            />
          );
        })}
      </div>
    );
  } catch {
    const html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return (
      <div
        className="prose prose-sm sm:prose-base max-w-none whitespace-pre-line"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, PURIFY_CONFIG) }}
      />
    );
  }
}
