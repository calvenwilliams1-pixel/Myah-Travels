"use client";

import React from "react";
import { GalleryData } from "@/types/blocks";
import ImageSourcePicker from "../ImageSourcePicker";

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
    <div className="space-y-4">
      {data.images.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No images yet. Add one below.
        </p>
      )}
      {data.images.map((img, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded p-3 space-y-2 bg-gray-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">
              Image {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="text-xs text-red-500 hover:text-red-700"
              aria-label={`Remove image ${i + 1}`}
            >
              Remove
            </button>
          </div>
          <ImageSourcePicker
            value={img.url}
            onChange={(url) => updateImage(i, "url", url)}
            folder="posts"
            label={`Image ${i + 1}`}
          />
          <input
            type="text"
            value={img.caption}
            onChange={(e) => updateImage(i, "caption", e.target.value)}
            placeholder="Caption (optional)"
            className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addImage}
        className="px-3 py-2 bg-gray-100 rounded text-sm hover:bg-gray-200 w-full"
      >
        + Add Image
      </button>
    </div>
  );
}
