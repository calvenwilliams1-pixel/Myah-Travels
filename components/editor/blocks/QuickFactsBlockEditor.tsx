"use client";

import React from "react";
import { QuickFactsData } from "@/types/blocks";

interface QuickFactsBlockEditorProps {
  data: QuickFactsData;
  onChange: (data: Partial<QuickFactsData>) => void;
}

export default function QuickFactsBlockEditor({ data, onChange }: QuickFactsBlockEditorProps) {
  const addFact = () => {
    onChange({ facts: [...data.facts, { label: "", value: "" }] });
  };

  const removeFact = (index: number) => {
    const updated = data.facts.filter((_, i) => i !== index);
    onChange({ facts: updated });
  };

  const updateFact = (index: number, field: "label" | "value", value: string) => {
    const updated = data.facts.map((fact, i) =>
      i === index ? { ...fact, [field]: value } : fact
    );
    onChange({ facts: updated });
  };

  return (
    <div className="space-y-2">
      {data.facts.map((fact, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={fact.label}
            onChange={(e) => updateFact(i, "label", e.target.value)}
            placeholder="Label (e.g., Best Time)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <input
            type="text"
            value={fact.value}
            onChange={(e) => updateFact(i, "value", e.target.value)}
            placeholder="Value (e.g., Spring)"
            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm"
          />
          <button
            onClick={() => removeFact(i)}
            className="px-2 text-red-500 text-xs"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addFact}
        className="px-3 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
      >
        + Add Fact
      </button>
    </div>
  );
}
