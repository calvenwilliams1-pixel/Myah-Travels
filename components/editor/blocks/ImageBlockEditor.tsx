"use client";

import React from "react";
import { ImageData } from "@/types/blocks";

interface ImageBlockEditorProps {
  data: ImageData;
  onChange: (data: Partial<ImageData>) => void;
}

export default function ImageBlockEditor({ data, onChange }: ImageBlockEditorProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={data.imageUrl}
        onChange={(e) => onChange({ imageUrl: e.target.value })}
        placeholder="Image URL"
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
      />
      <input
        type="text"
        value={data.alt}
        onChange={(e) => onChange({ alt: e.target.value })}
        placeholder="Alt text"
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
      />
      <input
        type="text"
        value={data.caption || ""}
        onChange={(e) => onChange({ caption: e.target.value })}
        placeholder="Caption (optional)"
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
      />
    </div>
  );
}
