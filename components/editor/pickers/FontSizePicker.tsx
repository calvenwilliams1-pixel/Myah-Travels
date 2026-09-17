"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { SIZE_PRESETS, SIZE_MIN_PX, SIZE_MAX_PX, SIZE_STEP_PX } from "@/lib/editor/text-sizes";

interface FontSizePickerProps {
  editor: Editor;
  onClose?: () => void;
}

export default function FontSizePicker({ editor, onClose }: FontSizePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [finePx, setFinePx] = useState(16);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const currentSize = editor.getAttributes("textStyle").fontSize || "";

  function apply(value: string) {
    if (!value) {
      editor.chain().focus().unsetFontSize().run();
    } else {
      editor.chain().focus().setFontSize(value).run();
    }
    onClose?.();
  }

  function applyFine(px: number) {
    const clamped = Math.max(SIZE_MIN_PX, Math.min(SIZE_MAX_PX, px));
    apply(clamped / 16 + "rem");
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-56"
    >
      <p className="text-xs font-medium text-gray-600 mb-2">Size preset</p>
      <div className="grid grid-cols-5 gap-1 mb-3">
        {SIZE_PRESETS.map((size) => (
          <button
            key={size.value}
            type="button"
            onClick={() => apply(size.value)}
            className={
              "px-1 py-1 rounded text-xs " +
              (currentSize === size.value
                ? "bg-primary text-white"
                : "border border-gray-200 hover:border-primary")
            }
            title={size.label}
            aria-label={"Set size to " + size.label}
            aria-pressed={currentSize === size.value}
          >
            {size.label.slice(0, 2)}
          </button>
        ))}
      </div>

      <p className="text-xs font-medium text-gray-600 mb-2">Fine-tune</p>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={SIZE_MIN_PX}
          max={SIZE_MAX_PX}
          step={SIZE_STEP_PX}
          value={finePx}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFinePx(v);
            applyFine(v);
          }}
          className="flex-1"
          aria-label="Fine-tune font size"
        />
        <span className="text-xs text-gray-500 w-10 text-right">{finePx}px</span>
      </div>

      <button
        type="button"
        onClick={() => apply("")}
        className="mt-3 w-full text-xs text-gray-500 hover:text-gray-700 text-left"
      >
        Reset to default
      </button>
    </div>
  );
}
