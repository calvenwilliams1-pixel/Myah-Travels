"use client";

import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import CanvasRenderer from "@/components/editor/canvas/CanvasRenderer";
import { parseCanvasDocument } from "@/lib/canvas";

interface CanvasBlockComponentProps {
  node: {
    attrs: {
      templateId: number;
      templateName: string;
      canvasJson: string;
    };
  };
}

export default function CanvasBlockComponent({ node }: CanvasBlockComponentProps) {
  const { templateId, templateName, canvasJson } = node.attrs;

  if (!canvasJson) {
    return (
      <NodeViewWrapper className="canvas-block-wrapper">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <p className="text-sm text-gray-500">Canvas Block</p>
          <p className="text-xs text-gray-400">
            {templateName || `Template #${templateId}`}
          </p>
        </div>
      </NodeViewWrapper>
    );
  }

  const doc = parseCanvasDocument(canvasJson);

  if (!doc) {
    return (
      <NodeViewWrapper className="canvas-block-wrapper">
        <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center">
          <p className="text-sm text-red-500">Invalid canvas data</p>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="canvas-block-wrapper">
      <div className="border-2 border-emerald-200 rounded-lg overflow-hidden">
        <div className="bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
          🎨 {templateName || `Canvas Block #${templateId}`}
        </div>
        <CanvasRenderer document={doc} />
      </div>
    </NodeViewWrapper>
  );
}
