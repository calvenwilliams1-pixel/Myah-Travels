"use client";

import React, { useState } from "react";
import { CanvasElement } from "@/types/canvas";

interface ButtonElementViewProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onBeginEdit?: () => void;
}

export default function ButtonElementView({ element, onUpdate, onBeginEdit }: ButtonElementViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.text || "Click Here");
  const [link, setLink] = useState(element.link || "");

  const handleSave = () => {
    onUpdate(element.id, { text, link });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText(element.text || "Click Here");
    setLink(element.link || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div
        className="w-full h-full p-2 bg-white border border-emerald-300 rounded overflow-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <label className="text-xs text-gray-600 block mb-1">Button Text</label>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-2"
        />
        <label className="text-xs text-gray-600 block mb-1">Link URL</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://example.com"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs"
          >
            Done
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        backgroundColor: element.backgroundColor || "#4a7c59",
        color: element.textColor || "#ffffff",
        borderRadius: element.borderRadius || 8,
        fontSize: element.fontSize || 16,
        fontWeight: element.fontWeight || "normal",
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setText(element.text || "Click Here");
        setLink(element.link || "");
        if (onBeginEdit) onBeginEdit();
        setIsEditing(true);
      }}
    >
      {element.text || "Click Here"}
    </div>
  );
}
