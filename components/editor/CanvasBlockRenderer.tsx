import React from "react";
import CanvasRenderer from "@/components/editor/canvas/CanvasRenderer";
import { parseCanvasDocument } from "@/lib/canvas/parse";

interface CanvasBlockRendererProps {
  canvasJson: string;
  templateName?: string;
}

export default function CanvasBlockRenderer({ canvasJson, templateName }: CanvasBlockRendererProps) {
  const doc = parseCanvasDocument(canvasJson);

  if (!doc) {
    return (
      <div className="my-6 border border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-400">
        Canvas block unavailable
      </div>
    );
  }

  return (
    <div className="my-6">
      {templateName && (
        <p className="text-xs text-gray-400 mb-2">{templateName}</p>
      )}
      <CanvasRenderer document={doc} />
    </div>
  );
}
