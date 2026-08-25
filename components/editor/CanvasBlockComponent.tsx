"use client";

import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { parseCanvasDocument, MAX_CANVAS_JSON_LENGTH } from "@/lib/canvas/parse";

const MiniCanvasEditor = dynamic(
  () => import("./canvas/MiniCanvasEditorFull"),
  {
    ssr: false,
    loading: () => (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <p className="text-sm text-gray-500">Loading canvas editor...</p>
      </div>
    ),
  }
);

interface CanvasBlockComponentProps {
  node: {
    attrs: {
      templateId: number | string | null;
      templateName: string;
      canvasJson: string;
    };
  };
  updateAttributes: (attrs: Record<string, string>) => void;
}

export default function CanvasBlockComponent({ node, updateAttributes }: CanvasBlockComponentProps) {
  const { templateId, templateName, canvasJson } = node.attrs;

  const templateIdNum = Number(templateId) || 0;
  const displayTitle = templateName?.trim() || `Template #${templateIdNum}`;

  const handleCanvasChange = (newJson: string) => {
    updateAttributes({ canvasJson: newJson });
  };

  if (!canvasJson) {
    return (
      <NodeViewWrapper className="canvas-block-wrapper">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500">Canvas Block</p>
          <p className="text-xs text-gray-400">{displayTitle}</p>
        </div>
      </NodeViewWrapper>
    );
  }

  if (canvasJson.length > MAX_CANVAS_JSON_LENGTH) {
    return (
      <NodeViewWrapper className="canvas-block-wrapper">
        <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center">
          <p className="text-sm text-red-500">Canvas data too large</p>
          <p className="text-xs text-gray-400 mt-1">{displayTitle}</p>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="canvas-block-wrapper">
      <div className="border-2 border-emerald-200 rounded-lg overflow-hidden">
        <div className="bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
          🎨 {displayTitle}
        </div>
        <ErrorBoundary>
          <MiniCanvasEditor
            initialJson={canvasJson}
            onChange={handleCanvasChange}
          />
        </ErrorBoundary>
      </div>
    </NodeViewWrapper>
  );
}
