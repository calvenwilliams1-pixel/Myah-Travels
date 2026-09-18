import DOMPurify from "isomorphic-dompurify";
import React from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import FontSize from "@/lib/editor/font-size-extension";
import { YouTubeEmbedNode } from "@/lib/editor/youtube-node";
import CanvasBlockRenderer from "./CanvasBlockRenderer";

// Registered extensions MUST match the editor's set in TipTapEditor.tsx.
// Any node or mark the editor can produce has to be renderable here,
// otherwise generateHTML throws and the fallback leaks raw content.
const RENDER_EXTENSIONS = [
  StarterKit.configure({ horizontalRule: false }),
  Image,
  Link,
  Underline,
  TextStyle,
  FontSize,
  FontFamily,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  HorizontalRule,
  YouTubeEmbedNode,
];

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
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
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
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    );
  }
}
