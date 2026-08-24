"use client";

import React from "react";
import { NodeViewWrapper } from "@tiptap/react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  parseCanvasDocument,
  MAX_CANVAS_JSON_LENGTH,
} from "@/lib/canvas/parse";

const CanvasRenderer = dynamic(
  () => import("@/components/editor/canvas/CanvasRenderer"),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-live="polite"
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
      >
        <p className="text-sm text-gray-500">Loading canvas...</p>
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
}

export default function CanvasBlockComponent({ node }: CanvasBlockComponentProps) {
  const { templateId, templateName, canvasJson } = node.attrs;

  const templateIdNum = Number(templateId) || 0;
  const displayTitle = templateName?.trim() || `Template #${templateIdNum}`;

  const doc = React.useMemo(() => {
    if (!canvasJson || canvasJson.length > MAX_CANVAS_JSON_LENGTH) {
      return null;
    }
    return parseCanvasDocument(canvasJson, process.env.NODE_ENV === "development");
  }, [canvasJson]);

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

  if (canvasJson.length > MAX_CANVAS_JSON_LENGTH || !doc) {
    return (
      <NodeViewWrapper className="canvas-block-wrapper">
        <div
          role="status"
          aria-live="polite"
          className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center"
        >
          <p className="text-sm text-red-500">Invalid canvas data</p>
          <p className="text-xs text-gray-400 mt-1">{displayTitle}</p>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper className="canvas-block-wrapper">
      <div
        aria-label={`Canvas ${displayTitle}`}
        className="border-2 border-emerald-200 rounded-lg overflow-hidden"
      >
        <div className="bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
          🎨 {displayTitle}
        </div>
        <ErrorBoundary>
          <CanvasRenderer document={doc} />
        </ErrorBoundary>
      </div>
    </NodeViewWrapper>
  );
}
