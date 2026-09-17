"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ImageSourcePicker from "@/components/editor/ImageSourcePicker";
import { PALETTES } from "@/lib/theme/palettes";

type BlockType = "image" | "callout" | "notice";
type BlockSlot = "before-day" | "after-morning" | "after-afternoon" | "after-evening";
type BlockSize = "small" | "medium" | "full";
type BlockVariant = "tip" | "warning" | "info";

interface AddBlockFormProps {
  itineraryId: number;
  dayId: number;
  onSaved: () => void;
  onCancel: () => void;
}

const SLOT_OPTIONS: Array<{ value: BlockSlot; label: string }> = [
  { value: "before-day", label: "Before day starts" },
  { value: "after-morning", label: "After morning" },
  { value: "after-afternoon", label: "After afternoon" },
  { value: "after-evening", label: "After evening" },
];

const SIZE_OPTIONS: Array<{ value: BlockSize; label: string }> = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "full", label: "Full width" },
];

const VARIANT_OPTIONS: Array<{ value: BlockVariant; label: string }> = [
  { value: "tip", label: "Tip" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

export default function AddBlockForm({
  itineraryId,
  dayId,
  onSaved,
  onCancel,
}: AddBlockFormProps) {
  const [blockType, setBlockType] = useState<BlockType>("image");
  const [slot, setSlot] = useState<BlockSlot>("after-morning");
  const [size, setSize] = useState<BlockSize>("medium");
  const [variant, setVariant] = useState<BlockVariant>("tip");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [textContent, setTextContent] = useState("");
  const [paletteOverride, setPaletteOverride] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);

    if (blockType === "image" && !imageUrl.trim()) {
      setError("Image is required");
      return;
    }
    if ((blockType === "callout" || blockType === "notice") && !textContent.trim()) {
      setError("Text is required");
      return;
    }

    setIsSaving(true);
    const body: any = {
      itineraryId,
      dayId,
      blockType,
      slot,
      size,
      paletteOverride: paletteOverride || null,
    };
    if (blockType === "image") {
      body.imageUrl = imageUrl.trim();
      body.imageAlt = imageAlt.trim() || undefined;
    } else {
      body.textContent = textContent.trim();
      body.variant = variant;
    }

    const res = await fetch(`/api/itineraries/${itineraryId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error?.message || data.error || "Save failed");
      setIsSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        New Block
      </p>

      {/* Type selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Block type">
          {(["image", "callout", "notice"] as BlockType[]).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={blockType === t}
              onClick={() => setBlockType(t)}
              className={`p-2 rounded text-xs capitalize transition-colors ${
                blockType === t
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Slot selector */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Placed</label>
        <select
          value={slot}
          onChange={(e) => setSlot(e.target.value as BlockSlot)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          {SLOT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Type-specific fields */}
      {blockType === "image" && (
        <>
          <ImageSourcePicker
            value={imageUrl}
            onChange={setImageUrl}
            folder="itinerary"
            label="Image"
          />
          <Input
            label="Alt text"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Describe the image"
          />
        </>
      )}

      {(blockType === "callout" || blockType === "notice") && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Variant</label>
            <div className="grid grid-cols-3 gap-1">
              {VARIANT_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  type="button"
                  onClick={() => setVariant(v.value)}
                  className={`p-2 rounded text-xs transition-colors ${
                    variant === v.value
                      ? "bg-primary text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-primary"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Text</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Note for the client"
            />
          </div>
        </>
      )}

      {/* Size */}
      {blockType === "image" && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
          <div className="grid grid-cols-3 gap-1">
            {SIZE_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSize(s.value)}
                className={`p-2 rounded text-xs transition-colors ${
                  size === s.value
                    ? "bg-primary text-white"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-primary"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Palette override */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Palette override (optional)
        </label>
        <select
          value={paletteOverride}
          onChange={(e) => setPaletteOverride(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">Inherit section theme</option>
          {PALETTES.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Add Block"}
        </Button>
      </div>
    </div>
  );
}
