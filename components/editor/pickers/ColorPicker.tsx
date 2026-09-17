"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

interface ColorPreset {
  id: number;
  name: string;
  hex: string;
  kind: string;
  isDefault: boolean;
  isActive: boolean;
}

interface ColorPickerProps {
  editor: Editor;
  kind: "text" | "highlight";
  onClose?: () => void;
}

function isLowContrast(hex: string): boolean {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.85;
}

export default function ColorPicker({ editor, kind, onClose }: ColorPickerProps) {
  const [presets, setPresets] = useState<ColorPreset[]>([]);
  const [showRaw, setShowRaw] = useState(false);
  const [rawHex, setRawHex] = useState("#000000");
  const [saveName, setSaveName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [warnLowContrast, setWarnLowContrast] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/color-presets?kind=" + kind)
      .then((r) => r.json())
      .then((d) => setPresets(d.presets || []))
      .catch(() => {});
  }, [kind]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  function apply(hex: string) {
    if (kind === "text") {
      editor.chain().focus().setColor(hex).run();
    } else {
      editor.chain().focus().setHighlight({ color: hex }).run();
    }
    onClose?.();
  }

  function clear() {
    if (kind === "text") {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
    onClose?.();
  }

  function handleRawChange(value: string) {
    setRawHex(value);
    setWarnLowContrast(isLowContrast(value));
  }

  async function savePreset() {
    if (!saveName.trim() || !/^#[0-9A-Fa-f]{6}$/.test(rawHex)) return;
    setIsSaving(true);
    await fetch("/api/color-presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: saveName, hex: rawHex, kind }),
    });
    setIsSaving(false);
    setSaveName("");
    const res = await fetch("/api/color-presets?kind=" + kind);
    const data = await res.json();
    setPresets(data.presets || []);
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64"
    >
      <p className="text-xs font-medium text-gray-600 mb-2">
        {kind === "text" ? "Text colour" : "Highlight"}
      </p>

      <div className="grid grid-cols-6 gap-1 mb-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => apply(p.hex)}
            className="w-7 h-7 rounded border border-gray-200 hover:ring-2 hover:ring-primary/40 transition-all"
            style={{ backgroundColor: p.hex }}
            title={p.name + " (" + p.hex + ")"}
            aria-label={p.name}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={clear}
        className="w-full text-xs text-gray-500 hover:text-gray-700 text-left mb-2"
      >
        Remove colour
      </button>

      <div className="border-t border-gray-100 pt-2">
        {!showRaw ? (
          <button
            type="button"
            onClick={() => setShowRaw(true)}
            className="text-xs text-primary hover:underline"
          >
            + Custom colour
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={rawHex}
                onChange={(e) => handleRawChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
                aria-label="Pick custom colour"
              />
              <input
                type="text"
                value={rawHex}
                onChange={(e) => handleRawChange(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-200 rounded text-xs font-mono"
              />
            </div>
            {warnLowContrast && (
              <p className="text-xs text-amber-600">
                This colour is very light and may be hard to read on the white background.
              </p>
            )}
            <button
              type="button"
              onClick={() => apply(rawHex)}
              className="w-full text-xs bg-primary text-white px-2 py-1 rounded"
            >
              Apply
            </button>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Save as preset (name)"
              className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
            />
            <button
              type="button"
              onClick={savePreset}
              disabled={isSaving || !saveName.trim()}
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 disabled:opacity-40"
            >
              {isSaving ? "Saving..." : "Save as preset"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
