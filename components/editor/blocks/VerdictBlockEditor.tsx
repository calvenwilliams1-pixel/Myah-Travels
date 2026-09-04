"use client";

import React from "react";
import { VerdictData } from "@/types/blocks";

interface VerdictBlockEditorProps {
  data: VerdictData;
  onChange: (data: Partial<VerdictData>) => void;
}

export default function VerdictBlockEditor({ data, onChange }: VerdictBlockEditorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600">Rating:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange({ rating: star })}
            className={`text-lg ${(data.rating || 0) >= star ? "text-amber-500" : "text-gray-300"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={data.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Final verdict..."
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm min-h-[60px]"
      />
    </div>
  );
}
