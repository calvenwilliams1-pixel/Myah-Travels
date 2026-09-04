"use client";

import React from "react";
import { CalloutData } from "@/types/blocks";

interface CalloutBlockEditorProps {
  data: CalloutData;
  onChange: (data: Partial<CalloutData>) => void;
}

export default function CalloutBlockEditor({ data, onChange }: CalloutBlockEditorProps) {
  return (
    <div className="space-y-2">
      <select
        value={data.variant}
        onChange={(e) => onChange({ variant: e.target.value as "tip" | "warning" | "info" })}
        className="px-2 py-1 border border-gray-200 rounded text-xs"
      >
        <option value="tip">💡 Tip</option>
        <option value="warning">⚠️ Warning</option>
        <option value="info">ℹ️ Info</option>
      </select>
      <textarea
        value={data.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Write your tip, warning, or info..."
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm min-h-[60px]"
      />
    </div>
  );
}
