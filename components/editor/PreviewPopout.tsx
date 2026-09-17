"use client";

import React, { useEffect, useRef, useState } from "react";
import { BlockData, Template } from "@/types/blocks";
import TemplatePreview from "./blocks/TemplatePreview";

interface PreviewPopoutProps {
  blocks: BlockData[];
  template: Template;
  onClose: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 240;

export default function PreviewPopout({ blocks, template, onClose }: PreviewPopoutProps) {
  const [position, setPosition] = useState<Position>({ x: 80, y: 80 });
  const [size, setSize] = useState<Size>({ width: 480, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag the header
  useEffect(() => {
    if (!dragOffset) return;
    function onMouseMove(e: MouseEvent) {
      setPosition({ x: e.clientX - dragOffset!.x, y: e.clientY - dragOffset!.y });
    }
    function onMouseUp() {
      setDragOffset(null);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragOffset]);

  // Resize from bottom-right handle
  useEffect(() => {
    if (!resizeStart) return;
    function onMouseMove(e: MouseEvent) {
      const dx = e.clientX - resizeStart!.x;
      const dy = e.clientY - resizeStart!.y;
      setSize({
        width: Math.max(MIN_WIDTH, resizeStart!.w + dx),
        height: Math.max(MIN_HEIGHT, resizeStart!.h + dy),
      });
    }
    function onMouseUp() {
      setResizeStart(null);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizeStart]);

  // Esc closes; fullscreen handled by CSS
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isFullscreen) setIsFullscreen(false);
        else onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, onClose]);

  const headerStartDrag = (e: React.MouseEvent) => {
    if (isFullscreen) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleStartResize = (e: React.MouseEvent) => {
    if (isFullscreen) return;
    setResizeStart({ x: e.clientX, y: e.clientY, w: size.width, h: size.height });
  };

  const style = isFullscreen
    ? { position: "fixed" as const, inset: 0, width: "100vw", height: "100vh" }
    : {
        position: "fixed" as const,
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      };

  return (
    <div
      ref={containerRef}
      className="z-50 bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      style={style}
    >
      {/* Header (drag handle) */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 cursor-move select-none"
        onMouseDown={headerStartDrag}
      >
        <span className="text-xs font-medium text-gray-600">
          Preview — {template.name}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {isFullscreen ? "⤢ Exit" : "⤢"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            title="Close preview (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body — scrollable preview */}
      <div className="flex-1 overflow-auto">
        <TemplatePreview blocks={blocks} template={template} />
      </div>

      {/* Resize handle */}
      {!isFullscreen && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize"
          onMouseDown={handleStartResize}
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%)",
          }}
          title="Resize"
        />
      )}
    </div>
  );
}
