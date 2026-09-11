"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface HeroEditorProps {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroPreset: string;
  onChange: (field: string, value: string) => void;
}

const PRESETS = ["minimal", "coastal", "dark", "desert", "alpine", "tropical", "editorial", "sunset"];

export default function HeroEditor({
  heroTitle,
  heroSubtitle,
  heroImage,
  heroPreset,
  onChange,
}: HeroEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "portal-hero");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        onChange("heroImage", data.filePath);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }

    setIsUploading(false);
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Hero Banner</h3>

      <Input
        label="Hero Title"
        value={heroTitle}
        onChange={(e) => onChange("heroTitle", e.target.value)}
        placeholder="Smith Family Disney Trip"
      />

      <Input
        label="Hero Subtitle"
        value={heroSubtitle}
        onChange={(e) => onChange("heroSubtitle", e.target.value)}
        placeholder="June 15-22, 2026"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hero Image (optional - Canva export)
        </label>

        {heroImage ? (
          <div className="space-y-2">
            <img
              src={heroImage.startsWith("/") ? heroImage : "/uploads/" + heroImage}
              alt="Hero preview"
              className="w-full h-40 object-cover rounded-lg border border-gray-200"
            />
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <span className="inline-block px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  {isUploading ? "Uploading..." : "Replace Image"}
                </span>
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onChange("heroImage", "")}
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
              <p className="text-sm text-gray-500">
                {isUploading ? "Uploading..." : "Click to upload hero image"}
              </p>
            </div>
          </label>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fallback Preset (used if no image)
        </label>
        <select
          value={heroPreset}
          onChange={(e) => onChange("heroPreset", e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          {PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
