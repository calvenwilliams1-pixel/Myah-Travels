"use client";

import React, { useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { FONT_OPTIONS, DEFAULT_FONT } from "@/lib/editor/fonts";

interface FontFamilyPickerProps {
  editor: Editor;
  onClose?: () => void;
}

export default function FontFamilyPicker({ editor, onClose }: FontFamilyPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  const current = editor.getAttributes("textStyle").fontFamily || DEFAULT_FONT;

  function apply(value: string) {
    if (value === DEFAULT_FONT) {
      editor.chain().focus().unsetFontFamily().run();
    } else {
      editor.chain().focus().setFontFamily(value).run();
    }
    onClose?.();
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-56 max-h-80 overflow-y-auto"
    >
      {FONT_OPTIONS.map((font) => (
        <button
          key={font.value}
          type="button"
          onClick={() => apply(font.value)}
          className={
            "w-full text-left px-3 py-2 text-sm hover:bg-primary/10 " +
            (current === font.value ? "bg-primary/5 text-primary" : "")
          }
          style={{ fontFamily: font.value }}
        >
          {font.label}
        </button>
      ))}
    </div>
  );
}
