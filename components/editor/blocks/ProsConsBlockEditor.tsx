"use client";

import React from "react";
import { ProsConsData } from "@/types/blocks";

interface ProsConsBlockEditorProps {
  data: ProsConsData;
  onChange: (data: Partial<ProsConsData>) => void;
}

export default function ProsConsBlockEditor({ data, onChange }: ProsConsBlockEditorProps) {
  const addItem = (list: "pros" | "cons") => {
    onChange({ [list]: [...data[list], ""] });
  };

  const removeItem = (list: "pros" | "cons", index: number) => {
    const updated = data[list].filter((_, i) => i !== index);
    onChange({ [list]: updated });
  };

  const updateItem = (list: "pros" | "cons", index: number, value: string) => {
    const updated = data[list].map((item, i) => (i === index ? value : item));
    onChange({ [list]: updated });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-semibold text-emerald-700 mb-2">PROS</p>
        {data.pros.map((pro, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input
              type="text"
              value={pro}
              onChange={(e) => updateItem("pros", i, e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
            />
            <button onClick={() => removeItem("pros", i)} className="px-1 text-red-500 text-xs">✕</button>
          </div>
        ))}
        <button onClick={() => addItem("pros")} className="px-2 py-1 bg-gray-100 rounded text-xs">+ Pro</button>
      </div>
      <div>
        <p className="text-xs font-semibold text-red-600 mb-2">CONS</p>
        {data.cons.map((con, i) => (
          <div key={i} className="flex gap-1 mb-1">
            <input
              type="text"
              value={con}
              onChange={(e) => updateItem("cons", i, e.target.value)}
              className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
            />
            <button onClick={() => removeItem("cons", i)} className="px-1 text-red-500 text-xs">✕</button>
          </div>
        ))}
        <button onClick={() => addItem("cons")} className="px-2 py-1 bg-gray-100 rounded text-xs">+ Con</button>
      </div>
    </div>
  );
}
