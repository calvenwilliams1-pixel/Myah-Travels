"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Moveable from "react-moveable";
import { nanoid } from "nanoid";
import debounce from "lodash.debounce";
import { CanvasDocument, CanvasElement, ElementType } from "@/types/canvas";
import { createElement, getNextZIndex } from "@/lib/canvas/create-element";
import { parseCanvasDocument } from "@/lib/canvas/parse";
import TextElementView from "./elements/TextElementView";
import ImageElementView from "./elements/ImageElementView";
import ShapeElementView from "./elements/ShapeElementView";
import SmartBlockElementView from "./elements/SmartBlockElementView";
import ButtonElementView from "./elements/ButtonElementView";
import PdfElementView from "./elements/PdfElementView";
import PropertiesPanel from "./PropertiesPanel";
import LayersPanel from "./LayersPanel";
import MarqueeSelection from "./MarqueeSelection";

interface MiniCanvasEditorFullProps {
  initialJson: string;
  onChange: (json: string) => void;
}

const MAX_HISTORY = 30;

export default function MiniCanvasEditorFull({ initialJson, onChange }: MiniCanvasEditorFullProps) {
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);
  const [canvasDoc, setCanvasDoc] = useState<CanvasDocument | null>(() =>
    parseCanvasDocument(initialJson)
  );
  const lastJsonRef = useRef(initialJson);

  useEffect(() => {
    if (initialJson !== lastJsonRef.current) {
      setCanvasDoc(parseCanvasDocument(initialJson));
      lastJsonRef.current = initialJson;
    }
  }, [initialJson]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [undoStack, setUndoStack] = useState<CanvasDocument[]>([]);
  const [redoStack, setRedoStack] = useState<CanvasDocument[]>([]);
  const [showProperties, setShowProperties] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<any>(null);
  const dragOriginRef = useRef<Record<string, { x: number; y: number }>>({});
  const resizeOriginRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const isInteractingRef = useRef(false);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedOnChange = useRef(
    debounce((doc: CanvasDocument) => {
      onChange(JSON.stringify(doc));
    }, 300)
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.current.cancel();
    };
  }, []);

  const persistDoc = useCallback((doc: CanvasDocument, immediate = false) => {
    const json = JSON.stringify(doc);
    lastJsonRef.current = json;
    setCanvasDoc(doc);
    if (immediate) {
      debouncedOnChange.current.cancel();
      onChange(json);
    } else {
      debouncedOnChange.current(doc);
    }
  }, [onChange]);

  const pushUndo = useCallback((doc: CanvasDocument) => {
    setUndoStack((prev) => {
      const snapshot = JSON.parse(JSON.stringify(doc));
      return [...prev.slice(-MAX_HISTORY + 1), snapshot];
    });
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0 || !canvasDoc) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, JSON.parse(JSON.stringify(canvasDoc))]);
    setCanvasDoc(previous);
    setUndoStack((u) => u.slice(0, -1));
    debouncedOnChange.current.cancel();
    onChange(JSON.stringify(previous));
  }, [canvasDoc, undoStack, onChange]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !canvasDoc) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, JSON.parse(JSON.stringify(canvasDoc))]);
    setCanvasDoc(next);
    setRedoStack((r) => r.slice(0, -1));
    debouncedOnChange.current.cancel();
    onChange(JSON.stringify(next));
  }, [canvasDoc, redoStack, onChange]);

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setCanvasDoc((prev) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        ),
      };
      debouncedOnChange.current(updated);
      return updated;
    });
  }, []);

  const updateElements = useCallback((updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => {
    setCanvasDoc((prev) => {
      if (!prev) return prev;
      const updateMap = new Map(updates.map((u) => [u.id, u.changes]));
      const updated = {
        ...prev,
        elements: prev.elements.map((el) =>
          updateMap.has(el.id) ? { ...el, ...updateMap.get(el.id) } : el
        ),
      };
      debouncedOnChange.current(updated);
      return updated;
    });
  }, []);

  const addElement = useCallback((type: ElementType) => {
    if (!canvasDoc) return;
    pushUndo(canvasDoc);
    const newElement = createElement(type, canvasDoc.elements.length);
    newElement.zIndex = getNextZIndex(canvasDoc.elements);
    const updated = {
      ...canvasDoc,
      elements: [...canvasDoc.elements, newElement],
    };
    persistDoc(updated, true);
    setSelectedIds([newElement.id]);
  }, [canvasDoc, pushUndo, persistDoc]);

  const groupSelected = useCallback(() => {
    if (!canvasDoc || selectedIds.length < 2) return;
    pushUndo(canvasDoc);
    const groupId = nanoid(8);
    const updated = {
      ...canvasDoc,
      elements: canvasDoc.elements.map((el) =>
        selectedIds.includes(el.id) ? { ...el, groupId } : el
      ),
    };
    persistDoc(updated, true);
  }, [canvasDoc, selectedIds, pushUndo, persistDoc]);

  const ungroupSelected = useCallback(() => {
    if (!canvasDoc) return;
    const selectedGroupIds = new Set(
      canvasDoc.elements
        .filter((el) => selectedIds.includes(el.id) && el.groupId)
        .map((el) => el.groupId)
    );
    if (selectedGroupIds.size === 0) return;
    pushUndo(canvasDoc);
    const updated = {
      ...canvasDoc,
      elements: canvasDoc.elements.map((el) =>
        el.groupId && selectedGroupIds.has(el.groupId)
          ? { ...el, groupId: undefined }
          : el
      ),
    };
    persistDoc(updated, true);
  }, [canvasDoc, selectedIds, pushUndo, persistDoc]);

  const handleElementSelect = useCallback((el: CanvasElement, shiftKey: boolean) => {
    if (!canvasDoc) return;
    if (el.groupId) {
      const groupMembers = canvasDoc.elements.filter(
        (e) => e.groupId === el.groupId && e.visible !== false && !e.locked
      );
      const groupIds = groupMembers.map((e) => e.id);
      if (shiftKey) {
        setSelectedIds((prev) => Array.from(new Set([...prev, ...groupIds])));
      } else {
        setSelectedIds(groupIds);
      }
      return;
    }

    if (shiftKey) {
      setSelectedIds((prev) =>
        prev.includes(el.id) ? prev.filter((id) => id !== el.id) : [...prev, el.id]
      );
    } else {
      setSelectedIds([el.id]);
    }
  }, [canvasDoc]);

  const handleMarqueeSelect = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    if (!canvasDoc) return;
    const ids = canvasDoc.elements
      .filter((el) => {
        return (
          el.x >= rect.x &&
          el.y >= rect.y &&
          el.x + el.width <= rect.x + rect.width &&
          el.y + el.height <= rect.y + rect.height &&
          el.visible !== false &&
          !el.locked
        );
      })
      .map((el) => el.id);
    setSelectedIds(ids);
  }, [canvasDoc]);

  const deleteSelected = useCallback(() => {
    if (!canvasDoc) return;
    const deletableIds = selectedIds.filter((id) => {
      const el = canvasDoc.elements.find((e) => e.id === id);
      return el && !el.locked;
    });
    if (deletableIds.length === 0) return;
    pushUndo(canvasDoc);
    const updated = {
      ...canvasDoc,
      elements: canvasDoc.elements.filter((el) => !deletableIds.includes(el.id)),
    };
    persistDoc(updated, true);
    setSelectedIds([]);
  }, [canvasDoc, selectedIds, pushUndo, persistDoc]);

  const duplicateSelected = useCallback(() => {
    if (!canvasDoc) return;
    const duplicatableIds = selectedIds.filter((id) => {
      const el = canvasDoc.elements.find((e) => e.id === id);
      return el && !el.locked;
    });
    if (duplicatableIds.length === 0) return;
    pushUndo(canvasDoc);
    const newElements = canvasDoc.elements
      .filter((el) => duplicatableIds.includes(el.id))
      .map((el, index) => ({
        ...JSON.parse(JSON.stringify(el)),
        id: nanoid(8),
        groupId: undefined,
        x: el.x + 20,
        y: el.y + 20,
        zIndex: getNextZIndex(canvasDoc.elements) + index,
      }));
    const updated = {
      ...canvasDoc,
      elements: [...canvasDoc.elements, ...newElements],
    };
    persistDoc(updated, true);
    setSelectedIds(newElements.map((el) => el.id));
  }, [canvasDoc, selectedIds, pushUndo, persistDoc]);

  const bringForward = useCallback(() => {
    if (!canvasDoc || selectedIds.length !== 1) return;
    pushUndo(canvasDoc);
    const selected = canvasDoc.elements.find((el) => el.id === selectedIds[0]);
    if (!selected) return;
    const maxZ = Math.max(...canvasDoc.elements.map((el) => el.zIndex));
    if (selected.zIndex >= maxZ) return;
    const nextZ = selected.zIndex + 1;
    const other = canvasDoc.elements.find((el) => el.zIndex === nextZ);
    const updates: Array<{ id: string; changes: Partial<CanvasElement> }> = [
      { id: selected.id, changes: { zIndex: nextZ } },
    ];
    if (other) updates.push({ id: other.id, changes: { zIndex: selected.zIndex } });
    persistDoc({
      ...canvasDoc,
      elements: canvasDoc.elements.map((el) => {
        const update = updates.find((u) => u.id === el.id);
        return update ? { ...el, ...update.changes } : el;
      }),
    }, true);
  }, [canvasDoc, selectedIds, pushUndo, persistDoc]);

  const sendBackward = useCallback(() => {
    if (!canvasDoc || selectedIds.length !== 1) return;
    pushUndo(canvasDoc);
    const selected = canvasDoc.elements.find((el) => el.id === selectedIds[0]);
    if (!selected) return;
    const minZ = Math.min(...canvasDoc.elements.map((el) => el.zIndex));
    if (selected.zIndex <= minZ) return;
    const prevZ = selected.zIndex - 1;
    const other = canvasDoc.elements.find((el) => el.zIndex === prevZ);
    const updates: Array<{ id: string; changes: Partial<CanvasElement> }> = [
      { id: selected.id, changes: { zIndex: prevZ } },
    ];
    if (other) updates.push({ id: other.id, changes: { zIndex: selected.zIndex } });
    persistDoc({
      ...canvasDoc,
      elements: canvasDoc.elements.map((el) => {
        const update = updates.find((u) => u.id === el.id);
        return update ? { ...el, ...update.changes } : el;
      }),
    }, true);
  }, [canvasDoc, selectedIds, pushUndo, persistDoc]);

  const toggleVisibility = useCallback((id: string) => {
    if (!canvasDoc) return;
    pushUndo(canvasDoc);
    const el = canvasDoc.elements.find((e) => e.id === id);
    const newVisible = el ? el.visible === false : true;
    const updated = {
      ...canvasDoc,
      elements: canvasDoc.elements.map((item) =>
        item.id === id ? { ...item, visible: newVisible } : item
      ),
    };
    persistDoc(updated, true);
    if (newVisible === false) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  }, [canvasDoc, pushUndo, persistDoc]);

  const toggleLock = useCallback((id: string) => {
    if (!canvasDoc) return;
    pushUndo(canvasDoc);
    const el = canvasDoc.elements.find((e) => e.id === id);
    const newLocked = el ? !(el.locked ?? false) : true;
    const updated = {
      ...canvasDoc,
      elements: canvasDoc.elements.map((item) =>
        item.id === id ? { ...item, locked: newLocked } : item
      ),
    };
    persistDoc(updated, true);
    if (newLocked) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  }, [canvasDoc, pushUndo, persistDoc]);

  const renameElement = useCallback((id: string, newName: string) => {
    if (!canvasDoc) return;
    pushUndo(canvasDoc);
    const updated = {
      ...canvasDoc,
      elements: canvasDoc.elements.map((el) =>
        el.id === id ? { ...el, name: newName } : el
      ),
    };
    persistDoc(updated, true);
  }, [canvasDoc, pushUndo, persistDoc]);

  useEffect(() => {
    const handleResize = () => {
      if (moveableRef.current) {
        moveableRef.current.updateRect();
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target.isContentEditable
      ) return;

      if (!isFocused) return;
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
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "Escape") {
        setSelectedIds([]);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, duplicateSelected, deleteSelected]);

  const getTargetElements = useCallback(() => {
    if (!canvasRef.current) return [];
    return selectedIds
      .filter((id) => {
        const el = canvasDoc?.elements.find((e) => e.id === id);
        return el && !el.locked;
      })
      .map((id) => canvasRef.current?.querySelector(`[data-element-id="${id}"]`) as HTMLElement)
      .filter(Boolean);
  }, [selectedIds, canvasDoc]);

  const getGuidelineElements = useCallback(() => {
    if (!canvasRef.current || !canvasDoc) return [];
    return canvasDoc.elements
      .filter((el) => el.visible !== false && !el.locked && !selectedIds.includes(el.id))
      .map((el) => canvasRef.current?.querySelector(`[data-element-id="${el.id}"]`) as HTMLElement)
      .filter(Boolean);
  }, [canvasDoc, selectedIds]);

  if (!canvasDoc) {
    return <div className="p-4 text-center text-sm text-red-500">Invalid canvas data</div>;
  }

  return (
    <div
      className="mini-canvas-editor border border-gray-200 rounded-lg"
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsFocused(false);
        }
      }}
      tabIndex={0}
    >
      {/* Mini toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <button onClick={undo} disabled={undoStack.length === 0} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">
          Undo
        </button>
        <button onClick={redo} disabled={redoStack.length === 0} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">
          Redo
        </button>
        <button onClick={() => addElement("text")} className="px-2 py-1 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-800">
          + Text
        </button>
        <button onClick={() => addElement("image")} className="px-2 py-1 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-800">
          + Image
        </button>
        <button onClick={() => addElement("shape")} className="px-2 py-1 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-800">
          + Shape
        </button>
        <button onClick={() => addElement("button")} className="px-2 py-1 text-xs bg-emerald-700 text-white rounded hover:bg-emerald-800">
          + Button
        </button>
        <button onClick={duplicateSelected} disabled={selectedIds.length === 0} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40">
          Duplicate
        </button>
        <button onClick={deleteSelected} disabled={selectedIds.length === 0} className="px-2 py-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded hover:bg-red-200 disabled:opacity-40">
          Delete
        </button>
        {selectedIds.length > 1 && (
          <button onClick={groupSelected} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100">
            Group
          </button>
        )}
        {selectedIds.some((id) => canvasDoc.elements.find((el) => el.id === id)?.groupId) && (
          <button onClick={ungroupSelected} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100">
            Ungroup
          </button>
        )}
        <button onClick={() => setShowProperties(!showProperties)} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100">
          {showProperties ? "Hide Props" : "Show Props"}
        </button>
        <button onClick={() => setShowLayers(!showLayers)} className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100">
          {showLayers ? "Hide Layers" : "Show Layers"}
        </button>
      </div>

      <div className="flex">
        {/* Canvas area */}
        <div className="flex-1 p-4 bg-gray-100 overflow-auto">
          <div
            ref={(node) => { canvasRef.current = node; setContainerEl(node); }}
            className="relative bg-white shadow"
            style={{
              width: canvasDoc.canvas.width,
              height: canvasDoc.canvas.height,
              background: canvasDoc.canvas.background ?? "#fff",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedIds([]);
            }}
          >
            <MarqueeSelection
              onSelect={handleMarqueeSelect}
              canvasWidth={canvasDoc.canvas.width}
              canvasHeight={canvasDoc.canvas.height}
            />

            {canvasDoc.elements
              .filter((el) => el.visible !== false)
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
                    zIndex: el.zIndex,
                    position: "absolute",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleElementSelect(el, e.shiftKey);
                  }}
                >
                  <div
                    className="w-full h-full"
                    style={{
                      transform: `rotate(${el.rotation}deg)`,
                      transformOrigin: "center center",
                    }}
                  >
                    {renderElement(el, updateElement, pushUndo, canvasDoc)}
                  </div>
                </div>
              ))}
          {(() => {
            const moveableTargets = getTargetElements();
            return moveableTargets.length > 0 ? (
              <Moveable
                key="moveable-ready"
                ref={moveableRef}
                target={moveableTargets}
                container={containerEl}
                draggable={true}
                resizable={true}
                rotatable={true}
                snappable={true}
                elementGuidelines={getGuidelineElements()}
                             onDragStart={({ target }) => {
                  const id = target.getAttribute("data-element-id");
                  if (!id || !canvasDoc) return;
                  const el = canvasDoc.elements.find((e) => e.id === id);
                  if (el) dragOriginRef.current[id] = { x: el.x, y: el.y };
                  if (!isInteractingRef.current) {
                    pushUndo(canvasDoc);
                    isInteractingRef.current = true;
                  }
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
                  if (!canvasDoc) return;
                  targets.forEach((target) => {
                    const id = target.getAttribute("data-element-id");
                    if (!id) return;
                    const el = canvasDoc.elements.find((e) => e.id === id);
                    if (el) dragOriginRef.current[id] = { x: el.x, y: el.y };
                  });
                  if (!isInteractingRef.current) {
                    pushUndo(canvasDoc);
                    isInteractingRef.current = true;
                  }
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
                onDragEnd={() => {
                  isInteractingRef.current = false;
                  debouncedOnChange.current.flush();
                  if (moveableRef.current) {
                    moveableRef.current.updateRect();
                  }
                }}
                onResizeStart={({ target }) => {
                  const id = target.getAttribute("data-element-id");
                  if (!id || !canvasDoc) return;
                  const el = canvasDoc.elements.find((e) => e.id === id);
                  if (el) resizeOriginRef.current[id] = { x: el.x, y: el.y, width: el.width, height: el.height };
                  if (!isInteractingRef.current) {
                    pushUndo(canvasDoc);
                    isInteractingRef.current = true;
                  }
                }}
                onResize={({ target, width, height, drag }) => {
                  target.style.width = `${width}px`;
                  target.style.height = `${height}px`;
                  target.style.left = `${drag.left}px`;
                  target.style.top = `${drag.top}px`;
                }}
                onResizeEnd={({ target }) => {
                  const id = target.getAttribute("data-element-id");
                  if (!id) return;
                  updateElement(id, {
                    width: Math.round(target.offsetWidth),
                    height: Math.round(target.offsetHeight),
                    x: Math.round(parseFloat(target.style.left)),
                    y: Math.round(parseFloat(target.style.top)),
                  });
                  isInteractingRef.current = false;
                  debouncedOnChange.current.flush();
                  if (moveableRef.current) {
                    moveableRef.current.updateRect();
                  }
                }}
                onRotateStart={() => {
                  if (canvasDoc && !isInteractingRef.current) {
                    pushUndo(canvasDoc);
                    isInteractingRef.current = true;
                  }
                }}
                                onResizeGroupStart={({ targets }) => {
                  if (!canvasDoc) return;
                  targets.forEach((target) => {
                    const id = target.getAttribute("data-element-id");
                    if (!id) return;
                    const el = canvasDoc.elements.find((e) => e.id === id);
                    if (el) resizeOriginRef.current[id] = { x: el.x, y: el.y, width: el.width, height: el.height };
                  });
                  if (!isInteractingRef.current) {
                    pushUndo(canvasDoc);
                    isInteractingRef.current = true;
                  }
                }}
                onResizeGroup={({ targets, events }) => {
                  events.forEach(({ target, width, height, beforeTranslate }) => {
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
                  });
                }}
                onRotateGroupStart={() => {
                  if (canvasDoc && !isInteractingRef.current) {
                    pushUndo(canvasDoc);
                    isInteractingRef.current = true;
                  }
                }}
                onRotateGroup={({ targets, events }) => {
                  events.forEach(({ target, rotation }) => {
                    const id = target.getAttribute("data-element-id");
                    if (!id) return;
                    updateElement(id, { rotation: Math.round(rotation) });
                  });
                }}
                                onResizeGroupEnd={({ targets }) => {
                  targets.forEach((target) => {
                    const id = target.getAttribute("data-element-id");
                    if (!id) return;
                    updateElement(id, {
                      width: Math.round(target.offsetWidth),
                      height: Math.round(target.offsetHeight),
                      x: Math.round(parseFloat(target.style.left)),
                      y: Math.round(parseFloat(target.style.top)),
                    });
                  });
                  isInteractingRef.current = false;
                  debouncedOnChange.current.flush();
                }}
                onRotateGroupEnd={() => {
                  isInteractingRef.current = false;
                  debouncedOnChange.current.flush();
                }}
                onRotate={({ target, rotation }) => {
                  const id = target.getAttribute("data-element-id");
                  if (!id) return;
                  updateElement(id, { rotation: Math.round(rotation) });
                }}
                onRotateEnd={() => {
                  isInteractingRef.current = false;
                  debouncedOnChange.current.flush();
                }}
              />
            ) : null;
          })()}
        </div>

        {/* Properties panel */}
        {showProperties && selectedIds.length === 1 && (
          <div className="w-56 border-l border-gray-200 bg-white overflow-y-auto max-h-[400px]">
            <PropertiesPanel
              element={canvasDoc.elements.find((el) => el.id === selectedIds[0])!}
              onUpdate={updateElement}
              onDelete={deleteSelected}
              onDuplicate={duplicateSelected}
              onBringForward={bringForward}
              onSendBackward={sendBackward}
            />
          </div>
        )}
      </div>

      {/* Layers panel */}
      {showLayers && (
        <div className="border-t border-gray-200 bg-white px-3 py-2 max-h-[150px] overflow-y-auto">
          <LayersPanel
            elements={canvasDoc.elements}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onRename={renameElement}
          />
        </div>
      )}
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
      return <TextElementView element={el} onUpdate={update} onBeginEdit={() => pushUndo(canvasDoc)} />;
    case "image":
      return <ImageElementView element={el} onUpdate={update} />;
    case "shape":
      return <ShapeElementView element={el} />;
    case "list":
    case "checklist":
    case "proscons":
      return <SmartBlockElementView element={el} onUpdate={update} onBeginEdit={() => pushUndo(canvasDoc)} />;
    case "button":
      return <ButtonElementView element={el} onUpdate={update} onBeginEdit={() => pushUndo(canvasDoc)} />;
    case "pdf":
      return <PdfElementView element={el} />;
    default:
      return <div className="w-full h-full border-2 border-dashed border-gray-300 rounded" />;
  }
}
