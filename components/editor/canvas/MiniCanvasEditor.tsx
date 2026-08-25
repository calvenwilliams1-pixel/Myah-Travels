"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import CanvasRenderer from "./CanvasRenderer";
import { parseCanvasDocument } from "@/lib/canvas/parse";
import { CanvasDocument } from "@/types/canvas";
import debounce from "lodash.debounce";

interface MiniCanvasEditorProps {
  initialJson: string;
  onChange: (json: string) => void;
}

export default function MiniCanvasEditor({ initialJson, onChange }: MiniCanvasEditorProps) {
  const [doc, setDoc] = useState<CanvasDocument | null>(() =>
    parseCanvasDocument(initialJson)
  );
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedOnChange = useCallback(
    debounce((updatedDoc: CanvasDocument) => {
      onChange(JSON.stringify(updatedDoc));
    }, 250),
    [onChange]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const handleResize = (newWidth: number, newHeight: number) => {
    if (!doc) return;
    const updatedDoc = {
      ...doc,
      canvas: { ...doc.canvas, width: newWidth, height: newHeight },
    };
    setDoc(updatedDoc);
    debouncedOnChange(updatedDoc);
  };

  const handleResizeEnd = () => {
    if (doc) {
      debouncedOnChange.flush();
    }
  };

  if (!doc) {
    return (
      <div className="p-4 text-center text-sm text-red-500">
        Invalid canvas data
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div
        className="relative cursor-pointer group"
        onClick={() => setIsEditing(true)}
        title="Click to edit canvas"
      >
        <CanvasRenderer document={doc} />
        <div className="absolute inset-0 bg-transparent group-hover:bg-emerald-50 group-hover:bg-opacity-10 transition-colors" />
        <button className="absolute top-2 right-2 px-3 py-1 bg-emerald-700 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Edit Canvas
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <CanvasRenderer document={doc} />
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 cursor-se-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = doc.canvas.width;
          const startHeight = doc.canvas.height;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = Math.max(200, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(100, startHeight + (moveEvent.clientY - startY));
            handleResize(newWidth, newHeight);
          };

          const handleMouseUp = () => {
            handleResizeEnd();
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
          };

          document.addEventListener("mousemove", handleMouseMove);
          document.addEventListener("mouseup", handleMouseUp);
        }}
      />
      <button
        onClick={() => setIsEditing(false)}
        className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white rounded text-xs"
      >
        Done
      </button>
    </div>
  );
}
