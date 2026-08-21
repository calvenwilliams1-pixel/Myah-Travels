"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Moveable from "react-moveable";
import { nanoid } from "nanoid";
import debounce from "lodash.debounce";
import { CanvasDocument, CanvasElement, ElementType, createEmptyCanvas } from "@/types/canvas";
import { createElement, getNextZIndex } from "@/lib/canvas";
import TextElementView from "./elements/TextElementView";
import ImageElementView from "./elements/ImageElementView";
import ElementCatalog from "./ElementCatalog";

interface CanvasEditorProps {
  initialDocument?: string;
  contentType: string;
  onSave: (documentJson: string) => Promise<void>;
}

const MAX_HISTORY = 50;

export default function CanvasEditor({ initialDocument, contentType, onSave }: CanvasEditorProps) {
  const [canvasDoc, setCanvasDoc] = useState<CanvasDocument>(() => {
    if (initialDocument) {
      try {
        const parsed = JSON.parse(initialDocument);
        if (parsed.schemaVersion === 1 && Array.isArray(parsed.elements)) {
          return parsed as CanvasDocument;
        }
      } catch {
        // fall through
      }
    }
    return createEmptyCanvas(contentType);
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<CanvasDocument[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasDocument[]>([]);
  const [showCatalog, setShowCatalog] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const clipboardRef = useRef<CanvasElement[]>([]);
  const dragOriginRef = useRef<Record<string, { x: number; y: number }>>({});
  const resizeOriginRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const debouncedSaveRef = useRef(
    debounce((doc: CanvasDocument) => {
      onSaveRef.current(JSON.stringify(doc));
    }, 2000)
  );

  useEffect(() => {
    debouncedSaveRef.current(canvasDoc);
    return () => {
      // Flush pending save on unmount
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.flush();
      }
    };
  }, [canvasDoc]);

  const pushUndo = useCallback((doc: CanvasDocument) => {
    setUndoStack((prev) => {
      const snapshot = JSON.parse(JSON.stringify(doc));
      return [...prev.slice(-MAX_HISTORY + 1), snapshot];
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, JSON.parse(JSON.stringify(canvasDoc))]);
    setCanvasDoc(previous);
    setUndoStack((u) => u.slice(0, -1));
  }, [canvasDoc, undoStack]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, JSON.parse(JSON.stringify(canvasDoc))]);
    setCanvasDoc(next);
    setRedoStack((r) => r.slice(0, -1));
  }, [canvasDoc, redoStack]);

  const addElement = useCallback((type: ElementType) => {
    pushUndo(canvasDoc);
    const newElement = createElement(type, canvasDoc.elements.length);
    // Use getNextZIndex to avoid collisions
    newElement.zIndex = getNextZIndex(canvasDoc.elements);
    setCanvasDoc((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedIds([newElement.id]);
  }, [canvasDoc, pushUndo]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  }, []);

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushUndo(canvasDoc);
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => !selectedIds.includes(el.id)),
    }));
    setSelectedIds([]);
  }, [canvasDoc, selectedIds, pushUndo]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    pushUndo(canvasDoc);
    const newElements = canvasDoc.elements
      .filter((el) => selectedIds.includes(el.id))
      .map((el) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: nanoid(8),
        name: `${el.name} Copy`,
        x: el.x + 20,
        y: el.y + 20,
        zIndex: getNextZIndex(canvasDoc.elements),
      }));
    setCanvasDoc((prev) => ({
      ...prev,
      elements: [...prev.elements, ...newElements],
    }));
    setSelectedIds(newElements.map((el) => el.id));
  }, [canvasDoc, selectedIds, pushUndo]);

  const nudgeSelected = useCallback((dx: number, dy: number) => {
    if (selectedIds.length === 0) return;
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        selectedIds.includes(el.id)
          ? { ...el, x: el.x + dx, y: el.y + dy }
          : el
      ),
    }));
  }, [selectedIds]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target.isContentEditable
      ) return;

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        duplicateSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedIds(canvasDoc.elements.map((el) => el.id));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIds.length > 0) {
        clipboardRef.current = canvasDoc.elements.filter((el) => selectedIds.includes(el.id));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && clipboardRef.current.length > 0) {
        pushUndo(canvasDoc);
        const newElements = clipboardRef.current.map((el) => ({
          ...JSON.parse(JSON.stringify(el)),
          id: nanoid(8),
          x: el.x + 20,
          y: el.y + 20,
          zIndex: getNextZIndex(canvasDoc.elements),
        }));
        setCanvasDoc((prev) => ({
          ...prev,
          elements: [...prev.elements, ...newElements],
        }));
        setSelectedIds(newElements.map((el) => el.id));
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "Escape") {
        setSelectedIds([]);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        nudgeSelected(0, e.shiftKey ? -10 : -1);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        nudgeSelected(0, e.shiftKey ? 10 : 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudgeSelected(e.shiftKey ? -10 : -1, 0);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        nudgeSelected(e.shiftKey ? 10 : 1, 0);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canvasDoc, selectedIds, undo, redo, deleteSelected, duplicateSelected, pushUndo, nudgeSelected]);

  const getTargetElements = useCallback(() => {
    if (!canvasRef.current) return [];
    return selectedIds
      .map((id) => canvasRef.current?.querySelector(`[data-element-id="${id}"]`) as HTMLElement)
      .filter(Boolean);
  }, [selectedIds]);

  const getGuidelineElements = useCallback(() => {
    if (!canvasRef.current) return [];
    // Exclude selected elements from guidelines to prevent self-snap
    return canvasDoc.elements
      .filter((el) => !selectedIds.includes(el.id))
      .map((el) => canvasRef.current?.querySelector(`[data-element-id="${el.id}"]`) as HTMLElement)
      .filter(Boolean);
  }, [canvasDoc.elements, selectedIds]);

  return (
    <div className="flex h-screen">
      {showCatalog && <ElementCatalog onAddElement={addElement} />}

      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="mb-4 flex gap-3 items-center flex-wrap">
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
            onClick={() => setShowCatalog(!showCatalog)}
          >
            {showCatalog ? "Hide Catalog" : "Show Catalog"}
          </button>
          <button
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm"
            onClick={() => addElement("text")}
          >
            + Text
          </button>
          <button
            className="px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm"
            onClick={() => addElement("image")}
          >
            + Image
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm disabled:opacity-40"
            onClick={undo}
            disabled={undoStack.length === 0}
          >
            Undo
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm disabled:opacity-40"
            onClick={redo}
            disabled={redoStack.length === 0}
          >
            Redo
          </button>
          <button
            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm disabled:opacity-40"
            onClick={deleteSelected}
            disabled={selectedIds.length === 0}
          >
            Delete
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm disabled:opacity-40"
            onClick={duplicateSelected}
            disabled={selectedIds.length === 0}
          >
            Duplicate
          </button>
          <span className="text-xs text-gray-500 ml-auto">
            {canvasDoc.elements.length} elements
          </span>
        </div>

        <div
          ref={canvasRef}
          className="relative mx-auto bg-white shadow-lg"
          style={{
            width: canvasDoc.canvas.width,
            height: canvasDoc.canvas.height,
            background: canvasDoc.canvas.background || "#fff",
          }}
          onClick={() => setSelectedIds([])}
        >
          {canvasDoc.elements
            .filter((el) => el.visible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => (
              <div
                key={el.id}
                data-element-id={el.id}
                className={`canvas-element absolute cursor-move ${
                  selectedIds.includes(el.id) ? "outline outline-2 outline-emerald-500" : ""
                }`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  transform: `rotate(${el.rotation}deg)`,
                  zIndex: el.zIndex,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.shiftKey) {
                    setSelectedIds((prev) =>
                      prev.includes(el.id)
                        ? prev.filter((id) => id !== el.id)
                        : [...prev, el.id]
                    );
                  } else {
                    setSelectedIds([el.id]);
                  }
                }}
              >
                {renderElement(el, updateElement, pushUndo, canvasDoc)}
              </div>
            ))}
        </div>

        {selectedIds.length > 0 && (
          <Moveable
            target={getTargetElements()}
            draggable={true}
            resizable={true}
            rotatable={true}
            snappable={true}
            elementGuidelines={getGuidelineElements()}
            bounds={{ left: 0, top: 0, right: canvasDoc.canvas.width, bottom: canvasDoc.canvas.height }}
            onDragStart={({ target }) => {
              const id = target.getAttribute("data-element-id");
              if (!id) return;
              const el = canvasDoc.elements.find((e) => e.id === id);
              if (el) {
                dragOriginRef.current[id] = { x: el.x, y: el.y };
              }
              pushUndo(canvasDoc);
            }}
            onDrag={({ target, beforeTranslate }) => {
              const id = target.getAttribute("data-element-id");
              if (!id) return;
              const origin = dragOriginRef.current[id];
              if (!origin) return;
              updateElement(id, {
                x: Math.round(origin.x + beforeTranslate[0]),
                y: Math.round(origin.y + beforeTranslate[1]),
              });
            }}
            onDragGroupStart={({ targets }) => {
              targets.forEach((target) => {
                const id = target.getAttribute("data-element-id");
                if (!id) return;
                const el = canvasDoc.elements.find((e) => e.id === id);
                if (el) {
                  dragOriginRef.current[id] = { x: el.x, y: el.y };
                }
              });
              pushUndo(canvasDoc);
            }}
            onDragGroup={({ targets, events }) => {
              events.forEach(({ target, beforeTranslate }) => {
                const id = target.getAttribute("data-element-id");
                if (!id) return;
                const origin = dragOriginRef.current[id];
                if (!origin) return;
                updateElement(id, {
                  x: Math.round(origin.x + beforeTranslate[0]),
                  y: Math.round(origin.y + beforeTranslate[1]),
                });
              });
            }}
            onResizeStart={({ target }) => {
              const id = target.getAttribute("data-element-id");
              if (!id) return;
              const el = canvasDoc.elements.find((e) => e.id === id);
              if (el) {
                resizeOriginRef.current[id] = { x: el.x, y: el.y, width: el.width, height: el.height };
              }
              pushUndo(canvasDoc);
            }}
            onResize={({ target, width, height, beforeTranslate }) => {
              const id = target.getAttribute("data-element-id");
              if (!id) return;
              const origin = resizeOriginRef.current[id];
              if (!origin) return;
              updateElement(id, {
                width: Math.round(width),
                height: Math.round(height),
                x: Math.round(origin.x + (beforeTranslate?.[0] || 0)),
                y: Math.round(origin.y + (beforeTranslate?.[1] || 0)),
              });
            }}
            onRotateStart={() => {
              pushUndo(canvasDoc);
            }}
            onRotate={({ target, rotation }) => {
              const id = target.getAttribute("data-element-id");
              if (!id) return;
              updateElement(id, { rotation: Math.round(rotation) });
            }}
          />
        )}
      </div>
    </div>
  );
}

function renderElement(
  el: CanvasElement,
  update: (id: string, updates: Partial<CanvasElement>) => void,
  pushUndo: (doc: CanvasDocument) => void,
  canvasDoc: CanvasDocument
) {
  switch (el.type) {
    case "text":
      return (
        <TextElementView
          element={el}
          onUpdate={update}
          onBeginEdit={() => pushUndo(canvasDoc)}
        />
      );
    case "image":
      return <ImageElementView element={el} onUpdate={update} />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm">
          {el.type}
        </div>
      );
  }
}
