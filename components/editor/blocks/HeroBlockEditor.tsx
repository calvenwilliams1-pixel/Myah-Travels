"use client";

import React from "react";
import { HeroData, HeroSize } from "@/types/blocks";
import ImageSourcePicker from "../ImageSourcePicker";

interface HeroBlockEditorProps {
  data: HeroData;
  onChange: (data: Partial<HeroData>) => void;
}

const SIZE_OPTIONS: Array<{ value: HeroSize; label: string; hint: string }> = [
  { value: "banner", label: "Banner", hint: "Short strip" },
  { value: "medium", label: "Medium", hint: "Mid-height" },
  { value: "large", label: "Large", hint: "Standard hero" },
  { value: "fullscreen", label: "Full", hint: "Tall / cover" },
];

export default function HeroBlockEditor({ data, onChange }: HeroBlockEditorProps) {
  const currentSize: HeroSize = data.size ?? "large";

  return (
    <div className="space-y-3">
      <ImageSourcePicker
        value={data.imageUrl}
        onChange={(url) => onChange({ imageUrl: url })}
        folder="posts"
        label="Hero image"
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
        placeholder="Caption (optional — shown below the hero)"
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
      />

      {/* Size selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
        <div className="grid grid-cols-4 gap-1">
          {SIZE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ size: opt.value })}
              className={`p-2 rounded text-xs transition-colors ${
                currentSize === opt.value
                  ? "bg-primary text-white"
                  : "bg-gray-50 border border-gray-200 text-gray-700 hover:border-primary"
              }`}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text overlay */}
      <div className="border border-gray-200 rounded p-3 space-y-2 bg-gray-50">
        <p className="text-xs font-medium text-gray-600">
          Text overlay (optional — appears on top of the image)
        </p>
        <input
          type="text"
          value={data.overlayTitle || ""}
          onChange={(e) => onChange({ overlayTitle: e.target.value })}
          placeholder="Overlay title"
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
        />
        <input
          type="text"
          value={data.overlaySubtitle || ""}
          onChange={(e) => onChange({ overlaySubtitle: e.target.value })}
          placeholder="Overlay subtitle"
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
        />
        <input
          type="text"
          value={data.overlayCaption || ""}
          onChange={(e) => onChange({ overlayCaption: e.target.value })}
          placeholder="Overlay caption (small, bottom)"
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
        />
      </div>
    </div>
  );
}
