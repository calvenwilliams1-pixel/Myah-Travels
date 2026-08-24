"use client";

import React from "react";
import { NodeViewWrapper } from "@tiptap/react";

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

  return (
    <NodeViewWrapper className="canvas-block-wrapper">
      <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 bg-emerald-50">
        <div className="flex items-center gap-2">
          <span>🎨</span>
          <span className="text-sm font-semibold text-emerald-800">
            {templateName || `Canvas Block #${templateId}`}
          </span>
          <span className="text-xs text-emerald-600 ml-auto">
            Canvas block - renders on public page
          </span>
        </div>
        {!canvasJson && (
          <p className="text-xs text-gray-500 mt-2">
            No canvas data attached to this block.
          </p>
        )}
      </div>
    </NodeViewWrapper>
  );
}
