"use client";

import React, { useState } from "react";
import TemplateManager from "@/components/editor/canvas/TemplateManager";

interface InsertCanvasBlockButtonProps {
  contentType: string;
  onInsert: (templateId: number, templateName: string, canvasJson: string) => void;
}

export default function InsertCanvasBlockButton({ contentType, onInsert }: InsertCanvasBlockButtonProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowTemplates(true)}
        className="px-2 py-1 rounded text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        🎨 Canvas
      </button>

      {showTemplates && (
        <TemplateManager
          contentType={contentType}
          mode="browse"
          onClose={() => setShowTemplates(false)}
          onApply={(template) => {
            if (template) {
              onInsert(template.id, template.name, template.layoutData);
            }
            setShowTemplates(false);
          }}
        />
      )}
    </>
  );
}
