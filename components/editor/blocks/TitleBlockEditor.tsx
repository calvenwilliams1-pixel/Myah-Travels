"use client";

import React from "react";
import { TitleData } from "@/types/blocks";

interface TitleBlockEditorProps {
  data: TitleData;
  onChange: (data: Partial<TitleData>) => void;
}

export default function TitleBlockEditor({ data, onChange }: TitleBlockEditorProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={data.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Section heading..."
        className="w-full px-3 py-2 border border-gray-200 rounded text-lg font-semibold"
      />
      <select
        value={data.level}
        onChange={(e) => onChange({ level: Number(e.target.value) as 1 | 2 | 3 })}
        className="px-2 py-1 border border-gray-200 rounded text-xs"
      >
        <option value={1}>H1</option>
        <option value={2}>H2</option>
        <option value={3}>H3</option>
      </select>
    </div>
  );
}
