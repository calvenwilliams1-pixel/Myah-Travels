"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BlockData, Template } from "@/types/blocks";
import TemplatePreview from "./blocks/TemplatePreview";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";
import { useDocumentPiP } from "@/lib/hooks/useDocumentPiP";

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
const TITLE_BAR_HEIGHT = 36;
const MIN_VISIBLE_WIDTH = 200;

/**
 * Clamp a popout position so the title bar stays reachable.
 * The title bar is the only drag handle — if it goes off-screen
 * (especially past the top), the popout is unrecoverable.
 */
function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number
): Position {
  if (typeof window === "undefined") return { x, y };
  // Leave at least MIN_VISIBLE_WIDTH of the popout horizontally visible,
  // and the title bar fully visible vertically.
  const maxX = Math.max(0, window.innerWidth - MIN_VISIBLE_WIDTH);
  const maxY = Math.max(0, window.innerHeight - TITLE_BAR_HEIGHT);
  return {
    x: Math.max(0, Math.min(maxX, x)),
    y: Math.max(0, Math.min(maxY, y)),
  };
}

/**
 * Clamp a popout size so it never exceeds the viewport.
 */
function clampSize(width: number, height: number): Size {
  if (typeof window === "undefined") return { width, height };
  return {
    width: Math.min(window.innerWidth, Math.max(MIN_WIDTH, width)),
    height: Math.min(window.innerHeight, Math.max(MIN_HEIGHT, height)),
  };
}

export default function PreviewPopout({ blocks, template, onClose }: PreviewPopoutProps) {
  const [position, setPosition] = useState<Position>({ x: 80, y: 80 });
  const [size, setSize] = useState<Size>({ width: 480, height: 600 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [dragOffset, setDragOffset] = useState<Position | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusRestore(true);

  const pip = useDocumentPiP();
  const { isOpen: isPiPOpen, close: closePiP } = pip;

  // Drag the header
  useEffect(() => {
    if (!dragOffset) return;
    function onMouseMove(e: MouseEvent) {
      const raw = { x: e.clientX - dragOffset!.x, y: e.clientY - dragOffset!.y };
      setPosition(clampPosition(raw.x, raw.y, size.width, size.height));
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
      setSize(
        clampSize(resizeStart!.w + dx, resizeStart!.h + dy)
      );
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

  // Reclamp on window resize so a shrunk viewport pulls the popout back.
  useEffect(() => {
    function onResize() {
      setSize((s) => clampSize(s.width, s.height));
      setPosition((p) => clampPosition(p.x, p.y, size.width, size.height));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [size.width, size.height]);

  // Esc closes; fullscreen handled by CSS. Destructure stable pieces of
  // the PiP handle so effect deps are primitives/functions.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isPiPOpen) {
          closePiP();
        } else if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen, onClose, isPiPOpen, closePiP]);

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

  const handleOpenPiP = async () => {
    await pip.open({ width: size.width, height: size.height });
  };

  // Render the same preview content into the PiP window via portal.
  const pipContent =
    isPiPOpen && pip.container
      ? createPortal(
          <div className="bg-white min-h-full">
            <TemplatePreview blocks={blocks} template={template} />
          </div>,
          pip.container
        )
      : null;

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
    <>
      <div
        ref={containerRef}
        className="z-50 bg-white border border-gray-300 rounded-lg shadow-2xl flex flex-col overflow-hidden"
        style={style}
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50 cursor-move select-none"
          onMouseDown={headerStartDrag}
        >
          <span className="text-xs font-medium text-gray-600">
            Preview — {template.name}
          </span>
          <div className="flex items-center gap-1">
            {pip.isSupported && (
              <button
                type="button"
                onClick={isPiPOpen ? closePiP : handleOpenPiP}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                title={
                  isPiPOpen
                    ? "Close picture-in-picture"
                    : "Pop out to a floating window (drag to any monitor)"
                }
                aria-label={isPiPOpen ? "Close picture-in-picture" : "Pop out to picture-in-picture"}
              >
                {isPiPOpen ? "\u29C9 Close PiP" : "\u29C9 PiP"}
              </button>
            )}
            <span className="flex items-center gap-0.5 border-r border-gray-300 pr-2 mr-1" role="group" aria-label="Preview viewport size">
              <button
                type="button"
                onClick={() => setViewportWidth("desktop")}
                className={`text-xs px-2 py-1 rounded ${viewportWidth === "desktop" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"}`}
                title="Desktop width"
                aria-label="Desktop preview"
                aria-pressed={viewportWidth === "desktop"}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth("tablet")}
                className={`text-xs px-2 py-1 rounded ${viewportWidth === "tablet" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"}`}
                title="Tablet width (768px)"
                aria-label="Tablet preview"
                aria-pressed={viewportWidth === "tablet"}
              >
                Tablet
              </button>
              <button
                type="button"
                onClick={() => setViewportWidth("mobile")}
                className={`text-xs px-2 py-1 rounded ${viewportWidth === "mobile" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700"}`}
                title="Mobile width (375px)"
                aria-label="Mobile preview"
                aria-pressed={viewportWidth === "mobile"}
              >
                Mobile
              </button>
            </span>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? "\u2922 Exit" : "\u2922"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              title="Close preview (Esc)"
              aria-label="Close preview"
            >
              {"\u2715"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto preview-body bg-gray-100">
          <div
            className="mx-auto bg-white min-h-full transition-all duration-150"
            style={{
              maxWidth:
                viewportWidth === "tablet" ? "768px"
                : viewportWidth === "mobile" ? "375px"
                : "100%",
            }}
          >
            <TemplatePreview blocks={blocks} template={template} />
          </div>
        </div>

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
      {pipContent}
    </>
  );
}
