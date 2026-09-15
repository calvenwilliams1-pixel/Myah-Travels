"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import AddBlockForm from "./AddBlockForm";
import type { ItineraryBlock } from "./ItineraryEditor";

interface BlockListProps {
  itineraryId: number;
  dayId: number;
  blocks: ItineraryBlock[];
  onChanged: () => void;
}

const SLOT_LABELS: Record<string, string> = {
  "before-day": "Before day",
  "after-morning": "After morning",
  "after-afternoon": "After afternoon",
  "after-evening": "After evening",
};

export default function BlockList({
  itineraryId,
  dayId,
  blocks,
  onChanged,
}: BlockListProps) {
  const [showAdd, setShowAdd] = useState(false);

  async function removeBlock(id: number) {
    if (!confirm("Delete this block?")) return;
    await fetch(`/api/itinerary-blocks/${id}`, { method: "DELETE" });
    onChanged();
  }

  const grouped: Record<string, ItineraryBlock[]> = {};
  for (const b of blocks) {
    (grouped[b.slot] = grouped[b.slot] || []).push(b);
  }

  return (
    <div className="space-y-2 mt-2 pl-2 border-l-2 border-dashed border-gray-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          Blocks ({blocks.length})
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? "Cancel" : "+ Block"}
        </Button>
      </div>

      {showAdd && (
        <AddBlockForm
          itineraryId={itineraryId}
          dayId={dayId}
          onSaved={() => {
            setShowAdd(false);
            onChanged();
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {Object.entries(grouped).map(([slot, slotBlocks]) => (
        <div key={slot} className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            {SLOT_LABELS[slot] || slot}
          </p>
          {slotBlocks.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-gray-200 rounded p-2 flex items-center gap-2"
            >
              <span className="text-xs">
                {b.blockType === "image" ? "🖼️" : b.blockType === "callout" ? "💬" : "📌"}
              </span>
              <span className="text-xs flex-1 truncate">
                {b.blockType === "image"
                  ? (b.imageAlt || b.imageUrl || "Image")
                  : (b.textContent || "Note")}
              </span>
              {b.paletteOverride && (
                <span className="text-xs text-gray-400">{b.paletteOverride}</span>
              )}
              <button
                onClick={() => removeBlock(b.id)}
                className="text-red-500 hover:text-red-700 text-xs"
                aria-label="Delete block"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
