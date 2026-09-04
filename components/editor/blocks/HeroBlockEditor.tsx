"use client";

import React from "react";
import { HeroData } from "@/types/blocks";

interface HeroBlockEditorProps {
  data: HeroData;
  onChange: (data: Partial<HeroData>) => void;
}

export default function HeroBlockEditor({ data, onChange }: HeroBlockEditorProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={data.imageUrl}
        onChange={(e) => onChange({ imageUrl: e.target.value })}
        placeholder="Image URL (or upload)"
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
