"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";

interface HeroEditorProps {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroPreset: string;
  onChange: (field: string, value: string) => void;
}

const PRESETS = ["minimal", "coastal", "dark"];

export default function HeroEditor({
  heroTitle,
  heroSubtitle,
  heroImage,
  heroPreset,
  onChange,
}: HeroEditorProps) {
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

      <Input
        label="Hero Image URL (optional - Canva export)"
        value={heroImage}
        onChange={(e) => onChange("heroImage", e.target.value)}
        placeholder="/uploads/library/hero-image.png"
      />

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
