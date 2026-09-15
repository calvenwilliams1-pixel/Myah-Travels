"use client";

import React, { useRef, useState } from "react";

interface ImageSourcePickerProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}

export default function ImageSourcePicker({
  value,
  onChange,
  folder = "posts",
  label = "Image",
}: ImageSourcePickerProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setIsUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Upload failed");
        return;
      }

      // Upload route returns filePath; build a public URL from it.
      // Existing convention (per media library): /uploads/<filePath>
      const publicUrl = data.filePath?.startsWith("/")
        ? data.filePath
        : `/uploads/${data.filePath}`;
      onChange(publicUrl);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`text-xs px-2 py-1 rounded ${
            mode === "upload"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Upload from PC
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`text-xs px-2 py-1 rounded ${
            mode === "url"
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Paste URL
        </button>
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="w-full px-3 py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {isUploading ? "Uploading..." : "Choose image"}
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or /uploads/..."
          className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
        />
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {value && (
        <div className="flex items-center gap-2 mt-1">
          <img
            src={value}
            alt="Preview"
            className="w-12 h-12 object-cover rounded border border-gray-200"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="text-xs text-gray-500 truncate flex-1">{value}</span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
