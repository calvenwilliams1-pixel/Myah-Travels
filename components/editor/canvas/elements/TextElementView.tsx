"use client";

import React, { useState } from "react";
import { CanvasElement } from "@/types/canvas";

interface TextElementViewProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onBeginEdit?: () => void;
}

export default function TextElementView({ element, onUpdate, onBeginEdit }: TextElementViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <textarea
        autoFocus
        defaultValue={element.text}
        className="w-full h-full bg-transparent resize-none outline-none"
        style={{
          fontSize: element.fontSize,
          color: element.color,
          fontFamily: element.fontFamily,
          textAlign: element.textAlign,
          fontWeight: element.fontWeight || "normal",
        }}
        onBlur={(e) => {
          onUpdate(element.id, { text: e.target.value });
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div
      className="w-full h-full cursor-text"
      style={{
        fontSize: element.fontSize,
        color: element.color,
        fontFamily: element.fontFamily,
        textAlign: element.textAlign,
        fontWeight: element.fontWeight || "normal",
        whiteSpace: "pre-wrap",
      }}
      onDoubleClick={() => {
        if (onBeginEdit) onBeginEdit();
        setIsEditing(true);
      }}
    >
      {element.text || "Double-click to edit"}
    </div>
  );
}
