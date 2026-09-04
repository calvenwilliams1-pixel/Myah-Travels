"use client";

import React from "react";
import { QuoteData } from "@/types/blocks";

interface QuoteBlockEditorProps {
  data: QuoteData;
  onChange: (data: Partial<QuoteData>) => void;
}

export default function QuoteBlockEditor({ data, onChange }: QuoteBlockEditorProps) {
  return (
    <div className="space-y-2">
      <textarea
        value={data.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Quote text..."
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm min-h-[60px]"
      />
      <input
        type="text"
        value={data.author}
        onChange={(e) => onChange({ author: e.target.value })}
        placeholder="Author"
        className="w-full px-3 py-2 border border-gray-200 rounded text-sm"
      />
    </div>
  );
}
