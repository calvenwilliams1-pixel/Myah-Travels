"use client";

import React from "react";
import { GalleryData } from "@/types/blocks";

interface GalleryBlockEditorProps {
  data: GalleryData;
  onChange: (data: Partial<GalleryData>) => void;
}

export default function GalleryBlockEditor({ data, onChange }: GalleryBlockEditorProps) {
  const addImage = () => {
    onChange({ images: [...data.images, { url: "", caption: "" }] });
  };

  const removeImage = (index: number) => {
    const updated = data.images.filter((_, i) => i !== index);
    onChange({ images: updated });
  };

  const updateImage = (index: number, field: "url" | "caption", value: string) => {
    const updated = data.images.map((img, i) =>
      i === index ? { ...img, [field]: value } : img
    );
    onChange({ images: updated });
  };

  return (
    <div className="space-y-2">
      {data.images.map((img, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={img.url}
            onChange={(e) => updateImage(i, "url", e.target.value)}
            placeholder="Image URL"
            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <input
            type="text"
            value={img.caption}
            onChange={(e) => updateImage(i, "caption", e.target.value)}
            placeholder="Caption"
            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <button
            onClick={() => removeImage(i)}
            className="px-2 text-red-500 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addImage}
        className="px-3 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
      >
        + Add Image
      </button>
    </div>
  );
}
