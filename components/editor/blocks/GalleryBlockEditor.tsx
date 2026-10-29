"use client";

import React from "react";
import {
  GalleryData,
  GalleryStyle,
  GalleryColumns,
  GalleryAspect,
  GalleryGap,
  GalleryCaptionDisplay,
} from "@/types/blocks";
import ImageSourcePicker from "../ImageSourcePicker";

interface GalleryBlockEditorProps {
  data: GalleryData;
  onChange: (data: Partial<GalleryData>) => void;
}

const STYLE_OPTIONS: { value: GalleryStyle; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "masonry", label: "Masonry" },
  { value: "carousel", label: "Carousel" },
  { value: "hero-then-grid", label: "Hero + Grid" },
];

const COLUMNS_OPTIONS: { value: GalleryColumns; label: string }[] = [
  { value: 2, label: "2 columns" },
  { value: 3, label: "3 columns" },
  { value: 4, label: "4 columns" },
];

const ASPECT_OPTIONS: { value: GalleryAspect; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
  { value: "auto", label: "Auto" },
];

const GAP_OPTIONS: { value: GalleryGap; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const CAPTION_OPTIONS: { value: GalleryCaptionDisplay; label: string }[] = [
  { value: "below", label: "Below" },
  { value: "overlay", label: "Overlay" },
  { value: "hidden", label: "Hidden" },
];

function LayoutControls({
  data,
  onChange,
}: {
  data: GalleryData;
  onChange: (data: Partial<GalleryData>) => void;
}) {
  const style = data.style ?? "grid";
  const columns = data.columns ?? 3;
  const aspect = data.aspect ?? "landscape";
  const gap = data.gap ?? "medium";
  const captionDisplay = data.captionDisplay ?? "below";

  const selectClass =
    "px-2 py-1 border border-gray-200 rounded text-xs bg-white";

  return (
    <div className="flex flex-wrap gap-2 items-center pb-2 border-b border-gray-100">
      <label className="flex items-center gap-1 text-xs text-gray-600">
        <span>Style</span>
        <select
          value={style}
          onChange={(e) => onChange({ style: e.target.value as GalleryStyle })}
          className={selectClass}
          aria-label="Gallery style"
        >
          {STYLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      {(style === "grid" || style === "masonry" || style === "hero-then-grid") && (
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <span>Columns</span>
          <select
            value={columns}
            onChange={(e) => onChange({ columns: Number(e.target.value) as GalleryColumns })}
            className={selectClass}
            aria-label="Gallery columns"
          >
            {COLUMNS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      )}
      {(style === "grid" || style === "hero-then-grid") && (
        <label className="flex items-center gap-1 text-xs text-gray-600">
          <span>Aspect</span>
          <select
            value={aspect}
            onChange={(e) => onChange({ aspect: e.target.value as GalleryAspect })}
            className={selectClass}
            aria-label="Gallery aspect"
          >
            {ASPECT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      )}
      <label className="flex items-center gap-1 text-xs text-gray-600">
        <span>Gap</span>
        <select
          value={gap}
          onChange={(e) => onChange({ gap: e.target.value as GalleryGap })}
          className={selectClass}
          aria-label="Gallery gap"
        >
          {GAP_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-xs text-gray-600">
        <span>Captions</span>
        <select
          value={captionDisplay}
          onChange={(e) => onChange({ captionDisplay: e.target.value as GalleryCaptionDisplay })}
          className={selectClass}
          aria-label="Gallery caption display"
        >
          {CAPTION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
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
      <LayoutControls data={data} onChange={onChange} />
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
