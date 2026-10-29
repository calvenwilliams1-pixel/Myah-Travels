"use client";

import React, { useRef, useState } from "react";
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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB, matches lib/media MAX_IMAGE_SIZE

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

interface BulkUploadZoneProps {
  onUploaded: (urls: string[]) => void;
}

function BulkUploadZone({ onUploaded }: BulkUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [failures, setFailures] = useState<string[]>([]);

  async function uploadFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    if (arr.length === 0) return;

    const newFailures: string[] = [];
    const valid: File[] = [];
    for (const f of arr) {
      if (f.size > MAX_IMAGE_SIZE) {
        newFailures.push(`${f.name} (exceeds 10MB)`);
      } else {
        valid.push(f);
      }
    }

    if (valid.length === 0) {
      setFailures(newFailures);
      return;
    }

    setUploading(true);
    setFailures([]);
    setProgress({ current: 0, total: valid.length });

    const urls: string[] = [];
    for (let i = 0; i < valid.length; i++) {
      const file = valid[i];
      setProgress({ current: i + 1, total: valid.length });
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "posts");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          newFailures.push(`${file.name} (server rejected)`);
          continue;
        }
        const data = await res.json();
        const publicUrl = data.filePath?.startsWith("/")
          ? data.filePath
          : `/uploads/${data.filePath}`;
        urls.push(publicUrl);
      } catch {
        newFailures.push(`${file.name} (network error)`);
      }
    }

    setUploading(false);
    setProgress(null);
    setFailures(newFailures);

    if (urls.length > 0) {
      onUploaded(urls);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="space-y-1">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={
          "border-2 border-dashed rounded p-4 text-center text-xs cursor-pointer transition-colors " +
          (dragOver
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-gray-300 bg-gray-50 text-gray-500 hover:border-gray-400")
        }
        role="button"
        tabIndex={0}
        aria-label="Upload images"
      >
        {uploading && progress ? (
          <span>Uploading {progress.current} of {progress.total}...</span>
        ) : (
          <span>Drop images here, or click to browse</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) uploadFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {failures.length > 0 && (
        <div className="text-xs text-red-600">
          Failed: {failures.join(", ")}
        </div>
      )}
    </div>
  );
}

interface ThumbnailStripProps {
  images: { url: string; caption: string }[];
  focusedIndex: number | null;
  onFocus: (index: number) => void;
  onMove: (from: number, direction: "up" | "down") => void;
  onRemove: (index: number) => void;
}

function ThumbnailStrip({ images, focusedIndex, onFocus, onMove, onRemove }: ThumbnailStripProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded border border-gray-200">
      {images.map((img, i) => (
        <div
          key={i}
          className={
            "flex flex-col items-center gap-1 p-1 rounded " +
            (focusedIndex === i ? "ring-2 ring-blue-400 bg-white" : "")
          }
        >
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => onMove(i, "up")}
              disabled={i === 0}
              aria-label={`Move image ${i + 1} up`}
              className="text-xs px-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >↑</button>
            <button
              type="button"
              onClick={() => onMove(i, "down")}
              disabled={i === images.length - 1}
              aria-label={`Move image ${i + 1} down`}
              className="text-xs px-1 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            >↓</button>
          </div>
          <button
            type="button"
            onClick={() => onFocus(i)}
            aria-label={`Edit image ${i + 1}`}
            className="block w-[60px] h-[60px] rounded overflow-hidden border border-gray-300 bg-white hover:border-blue-400"
          >
            {img.url ? (
              <img
                src={img.url}
                alt={img.caption || `Image ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-xs text-gray-400">+</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={`Remove image ${i + 1}`}
            className="text-xs text-red-500 hover:text-red-700"
          >×</button>
        </div>
      ))}
    </div>
  );
}

export default function GalleryBlockEditor({ data, onChange }: GalleryBlockEditorProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const addImage = () => {
    onChange({ images: [...data.images, { url: "", caption: "" }] });
    setFocusedIndex(data.images.length);
  };

  const handleBulkUploaded = (urls: string[]) => {
    const newImages = urls.map((url) => ({ url, caption: "" }));
    onChange({ images: [...data.images, ...newImages] });
  };

  const removeImage = (index: number) => {
    const updated = data.images.filter((_, i) => i !== index);
    onChange({ images: updated });
    if (focusedIndex === index) setFocusedIndex(null);
    else if (focusedIndex !== null && focusedIndex > index) setFocusedIndex(focusedIndex - 1);
  };

  const moveImage = (from: number, direction: "up" | "down") => {
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= data.images.length) return;
    const updated = [...data.images];
    [updated[from], updated[to]] = [updated[to], updated[from]];
    onChange({ images: updated });
    if (focusedIndex === from) setFocusedIndex(to);
    else if (focusedIndex === to) setFocusedIndex(from);
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
      <BulkUploadZone onUploaded={handleBulkUploaded} />
      <ThumbnailStrip
        images={data.images}
        focusedIndex={focusedIndex}
        onFocus={setFocusedIndex}
        onMove={moveImage}
        onRemove={removeImage}
      />
      {data.images.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No images yet. Drop files above or click + Add Image.
        </p>
      )}
      {data.images.map((img, i) => {
        if (focusedIndex !== i) return null;
        return (
          <div
            key={i}
            className="border border-gray-200 rounded p-3 space-y-2 bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">
                Image {i + 1}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                  aria-label={`Remove image ${i + 1}`}
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => setFocusedIndex(null)}
                  className="text-xs text-gray-500 hover:text-gray-800"
                  aria-label="Close detail"
                >
                  Close
                </button>
              </div>
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
        );
      })}
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
