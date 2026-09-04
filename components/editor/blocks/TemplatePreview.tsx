"use client";

import React from "react";
import { BlockData, Template } from "@/types/blocks";
import PostRenderer from "../renderers/PostRenderer";

interface TemplatePreviewProps {
  blocks: BlockData[];
  template: Template;
}

export default function TemplatePreview({ blocks, template }: TemplatePreviewProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-auto max-h-[600px]">
      {/* Template summary */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h3 className="font-semibold text-sm">{template.name}</h3>
        <p className="text-xs text-gray-500 mt-1">{template.description}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {template.sections.map((section) => (
            <span
              key={section.id}
              className={`text-xs px-2 py-1 rounded ${
                section.state === "required"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {section.state === "required" ? "✓ " : "○ "}
              {section.type}
              {section.state === "required" ? " (Required)" : " (Optional)"}
            </span>
          ))}
        </div>
      </div>

      {/* Rendered preview */}
      <div className="p-4">
        <PostRenderer blocks={blocks} template={template} />
      </div>
    </div>
  );
}
