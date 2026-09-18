"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

interface DividerConfigProps {
  editor: Editor;
  onClose: () => void;
}

// Curated divider colours. Default is "theme" (inherits from CSS var).
// Others are neutral enough for editorial use.
const COLOURS: { label: string; value: string | null }[] = [
  { label: "Theme", value: null },
  { label: "Light gray", value: "#e5e7eb" },
  { label: "Mid gray", value: "#9ca3af" },
  { label: "Dark gray", value: "#4b5563" },
  { label: "Primary", value: "var(--color-primary)" },
  { label: "Accent", value: "var(--color-accent)" },
];

export default function DividerConfig({ editor, onClose }: DividerConfigProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const current = editor.getAttributes("horizontalRule");
  const [thickness, setThickness] = useState<number>(
    typeof current.thickness === "number" ? current.thickness : 2
  );
  const [colour, setColour] = useState<string | null>(current.colour ?? null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  function applyDivider() {
    editor
      .chain()
      .focus()
      .updateAttributes("horizontalRule", { thickness, colour })
      .run();
  }

  function handleThickness(value: number) {
    const clamped = Math.max(1, Math.min(8, value));
    setThickness(clamped);
    editor
      .chain()
      .focus()
      .updateAttributes("horizontalRule", { thickness: clamped, colour })
      .run();
  }

  function handleColour(value: string | null) {
    setColour(value);
    editor
      .chain()
      .focus()
      .updateAttributes("horizontalRule", { thickness, colour: value })
      .run();
  }

  function handleDelete() {
    // Delete the divider the cursor is currently inside. deleteNode
    // targets the node by type, which is more reliable than
    // deleteSelection (which requires the node to actually be selected).
    editor.chain().focus().deleteNode("horizontalRule").run();
    onClose();
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64"
    >
      <p className="text-xs font-medium text-gray-600 mb-2">Divider thickness</p>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="range"
          min={1}
          max={8}
          step={1}
          value={thickness}
          onChange={(e) => handleThickness(Number(e.target.value))}
          className="flex-1"
          aria-label="Divider thickness"
        />
        <span className="text-xs text-gray-500 w-10 text-right">{thickness}px</span>
      </div>

      <p className="text-xs font-medium text-gray-600 mb-2">Colour</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {COLOURS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => handleColour(c.value)}
            className={
              "px-2 py-1 rounded text-xs border " +
              (colour === c.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 hover:border-gray-300")
            }
            title={c.label}
            aria-pressed={colour === c.value}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
        <button
          type="button"
          onClick={handleDelete}
          className="text-xs text-red-600 hover:text-red-700"
          title="Delete this divider"
        >
          Delete divider
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1"
        >
          Done
        </button>
      </div>
    </div>
  );
}
