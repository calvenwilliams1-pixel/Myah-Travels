"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Moveable from "react-moveable";
import { nanoid } from "nanoid";
import debounce from "lodash.debounce";
import { CanvasDocument, CanvasElement, ElementType, createEmptyCanvas } from "@/types/canvas";
import { createElement, getNextZIndex } from "@/lib/canvas/create-element";
import TextElementView from "./elements/TextElementView";
import ImageElementView from "./elements/ImageElementView";
import ElementCatalog from "./ElementCatalog";
import PropertiesPanel from "./PropertiesPanel";
import LayersPanel from "./LayersPanel";
import ShapeElementView from "./elements/ShapeElementView";
import SmartBlockElementView from "./elements/SmartBlockElementView";
import ButtonElementView from "./elements/ButtonElementView";
import PdfElementView from "./elements/PdfElementView";
import PortalDatesElementView from "./elements/PortalDatesElementView";
import PortalNoticesElementView from "./elements/PortalNoticesElementView";
import PortalDocumentsElementView from "./elements/PortalDocumentsElementView";
import PortalFaqsElementView from "./elements/PortalFaqsElementView";
import TemplateManager from "./TemplateManager";
import SaveTemplateModal from "./SaveTemplateModal";
import PublishControls from "./PublishControls";
import MarqueeSelection from "./MarqueeSelection";
import ContextMenu from "./ContextMenu";
import { saveToClipboard, loadFromClipboard } from "@/lib/canvas/clipboard";

interface CanvasEditorProps {
  initialDocument?: string;
  contentType: string;
  onSave: (documentJson: string) => Promise<void>;
  initialStatus?: "draft" | "published" | "scheduled";
  initialScheduledAt?: string;
  onStatusChange?: (status: "draft" | "published" | "scheduled", scheduledAt?: string) => void;
}

const MAX_HISTORY = 50;

function generateCopyName(name: string, existingNames: string[]): string {
  const base = `${name} Copy`;
  let candidate = base;
  let count = 2;
  while (existingNames.includes(candidate)) {
    candidate = `${name} Copy ${count}`;
    count++;
  }
  return candidate;
}

export default function CanvasEditor({ initialDocument, contentType, onSave, initialStatus = "draft", initialScheduledAt, onStatusChange }: CanvasEditorProps) {
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
  const [showProperties, setShowProperties] = useState(true);
  const [showLayers, setShowLayers] = useState(true);
  const [showTemplates, setShowTemplates] = useState<"browse" | "manage" | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [propertiesPopup, setPropertiesPopup] = useState<{
    x: number;
    y: number;
    locked: boolean;
  } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isDraggingPopup, setIsDraggingPopup] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);
  const undoToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [publishStatus, setPublishStatus] = useState<"draft" | "published" | "scheduled">(initialStatus);
  const [scheduledAt, setScheduledAt] = useState<string | undefined>(initialScheduledAt);
  const canvasRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<any>(null);
  const dragOriginRef = useRef<Record<string, { x: number; y: number }>>({});
  const resizeOriginRef = useRef<Record<string, { x: number; y: number; width: number; height: number }>>({});

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const debouncedSaveRef = useRef(
    debounce(async (doc: CanvasDocument) => {
      try {
        await onSaveRef.current(JSON.stringify(doc));
        setSaveStatus("saved");
      } catch (err) {
        console.error("Save failed:", err);
        setSaveStatus("error");
      }
    }, 2000)
  );

  useEffect(() => {
    setSaveStatus("saving");
    debouncedSaveRef.current(canvasDoc);
  }, [canvasDoc]);

  useEffect(() => {
    return () => {
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.flush();
        debouncedSaveRef.current.cancel();
      }
      if (undoToastTimeoutRef.current) {
        clearTimeout(undoToastTimeoutRef.current);
      }
    };
  }, []);

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

  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2) return;
    pushUndo(canvasDoc);
    const groupId = nanoid(8);
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        selectedIds.includes(el.id) ? { ...el, groupId } : el
      ),
    }));
  }, [canvasDoc, selectedIds, pushUndo]);

  const ungroupSelected = useCallback(() => {
    const selectedGroupIds = new Set(
      canvasDoc.elements
        .filter((el) => selectedIds.includes(el.id) && el.groupId)
        .map((el) => el.groupId)
    );
    if (selectedGroupIds.size === 0) return;
    pushUndo(canvasDoc);
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.groupId && selectedGroupIds.has(el.groupId)
          ? { ...el, groupId: undefined }
          : el
      ),
    }));
  }, [canvasDoc, selectedIds, pushUndo]);

  const handleElementSelect = useCallback(
    (el: CanvasElement, shiftKey: boolean) => {
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
          prev.includes(el.id)
            ? prev.filter((id) => id !== el.id)
            : [...prev, el.id]
        );
      } else {
        setSelectedIds([el.id]);
      }
    },
    [canvasDoc.elements]
  );

  const handleShowProperties = useCallback(() => {
    if (!contextMenu) return;
    const MARGIN = 8;
    const POPUP_WIDTH = 280;
    const POPUP_HEIGHT = 400;

    setPropertiesPopup({
      x: Math.max(MARGIN, Math.min(contextMenu.x, window.innerWidth - POPUP_WIDTH - MARGIN)),
      y: Math.max(MARGIN, Math.min(contextMenu.y, window.innerHeight - POPUP_HEIGHT - MARGIN)),
    });
    setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    if (!propertiesPopup || propertiesPopup.locked) return;

    if (selectedIds.length !== 1) {
      setPropertiesPopup(null);
      return;
    }

    const selectedElement = canvasDoc.elements.find(
      (el) => el.id === selectedIds[0]
    );

    if (!selectedElement) {
      setPropertiesPopup(null);
    }
  }, [propertiesPopup, selectedIds, canvasDoc.elements]);

  useEffect(() => {
    if (!propertiesPopup || propertiesPopup.locked) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPropertiesPopup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [propertiesPopup]);

  const handlePopupDragStart = (e: React.MouseEvent) => {
    if (!propertiesPopup) return;
    setIsDraggingPopup(true);
    dragOffsetRef.current = {
      x: e.clientX - propertiesPopup.x,
      y: e.clientY - propertiesPopup.y,
    };
  };

  useEffect(() => {
    if (!isDraggingPopup) return;

    const onMouseMove = (e: MouseEvent) => {
      setPropertiesPopup((prev) =>
        prev
          ? {
              ...prev,
              x: e.clientX - dragOffsetRef.current.x,
              y: e.clientY - dragOffsetRef.current.y,
            }
          : null
      );
    };

    const onMouseUp = () => {
      setIsDraggingPopup(false);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDraggingPopup]);

  const handleMarqueeSelect = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
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
    },
    [canvasDoc.elements]
  );

  const deleteSelected = useCallback(() => {
    const deletableIds = selectedIds.filter((id) => {
      const el = canvasDoc.elements.find((e) => e.id === id);
      return el && !el.locked;
    });
    if (deletableIds.length === 0) return;
    pushUndo(canvasDoc);
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => !deletableIds.includes(el.id)),
    }));
    setSelectedIds([]);
    setShowUndoToast(true);
    if (undoToastTimeoutRef.current) {
      clearTimeout(undoToastTimeoutRef.current);
    }
    undoToastTimeoutRef.current = setTimeout(() => setShowUndoToast(false), 3000);
  }, [canvasDoc, selectedIds, pushUndo]);

  const duplicateSelected = useCallback(() => {
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
        name: generateCopyName(
          el.name || el.type,
          canvasDoc.elements.map((e) => e.name || e.type)
        ),
        x: el.x + 20,
        y: el.y + 20,
        zIndex: getNextZIndex(canvasDoc.elements) + index,
      }));
    setCanvasDoc((prev) => ({
      ...prev,
      elements: [...prev.elements, ...newElements],
    }));
    setSelectedIds(newElements.map((el) => el.id));
  }, [canvasDoc, selectedIds, pushUndo]);

  const nudgeSelected = useCallback((dx: number, dy: number) => {
    if (selectedIds.length === 0) return;
    pushUndo(canvasDoc);
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        selectedIds.includes(el.id) && !el.locked
          ? { ...el, x: el.x + dx, y: el.y + dy }
          : el
      ),
    }));
  }, [selectedIds, canvasDoc, pushUndo]);

  const bringForward = useCallback(() => {
    if (selectedIds.length !== 1) return;
    pushUndo(canvasDoc);
    const selected = canvasDoc.elements.find((el) => el.id === selectedIds[0]);
    if (!selected) return;
    const maxZ = Math.max(...canvasDoc.elements.map((el) => el.zIndex));
    if (selected.zIndex >= maxZ) return;
    const nextZ = selected.zIndex + 1;
    const other = canvasDoc.elements.find((el) => el.zIndex === nextZ);
    updateElement(selected.id, { zIndex: nextZ });
    if (other) updateElement(other.id, { zIndex: selected.zIndex });
  }, [canvasDoc, selectedIds, pushUndo, updateElement]);

  const sendBackward = useCallback(() => {
    if (selectedIds.length !== 1) return;
    pushUndo(canvasDoc);
    const selected = canvasDoc.elements.find((el) => el.id === selectedIds[0]);
    if (!selected) return;
    const minZ = Math.min(...canvasDoc.elements.map((el) => el.zIndex));
    if (selected.zIndex <= minZ) return;
    const prevZ = selected.zIndex - 1;
    const other = canvasDoc.elements.find((el) => el.zIndex === prevZ);
    updateElement(selected.id, { zIndex: prevZ });
    if (other) updateElement(other.id, { zIndex: selected.zIndex });
  }, [canvasDoc, selectedIds, pushUndo, updateElement]);

  const toggleVisibility = useCallback((id: string) => {
    pushUndo(canvasDoc);
    const el = canvasDoc.elements.find((e) => e.id === id);
    const newVisible = el ? el.visible === false : true;
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((item) =>
        item.id === id ? { ...item, visible: newVisible } : item
      ),
    }));
    if (newVisible === false) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  }, [canvasDoc, pushUndo]);

  const toggleLock = useCallback((id: string) => {
    pushUndo(canvasDoc);
    const el = canvasDoc.elements.find((e) => e.id === id);
    const newLocked = el ? !(el.locked ?? false) : true;
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((item) =>
        item.id === id ? { ...item, locked: newLocked } : item
      ),
    }));
    if (newLocked) {
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  }, [canvasDoc, pushUndo]);

  const renameElement = useCallback((id: string, newName: string) => {
    pushUndo(canvasDoc);
    setCanvasDoc((prev) => ({
      ...prev,
      elements: prev.elements.map((el) =>
        el.id === id ? { ...el, name: newName } : el
      ),
    }));
  }, [canvasDoc, pushUndo]);

  const saveAsTemplate = useCallback(async (name: string) => {
    try {
      const res = await fetch("/api/canvas/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          contentType,
          layoutData: JSON.stringify(canvasDoc),
        }),
      });
      if (res.ok) {
        setShowSaveModal(false);
        setSaveStatus("saved");
      } else {
        setSaveStatus("error");
      }
    } catch (err) {
      console.error("Save template failed:", err);
      setSaveStatus("error");
    }
  }, [canvasDoc, contentType]);

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
        setSelectedIds(
          canvasDoc.elements
            .filter((el) => el.visible !== false && !el.locked)
            .map((el) => el.id)
        );
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && selectedIds.length > 0) {
        const elementsToCopy = canvasDoc.elements.filter(
          (el) => selectedIds.includes(el.id) && !el.locked
        );
        saveToClipboard(elementsToCopy);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        const clipboardElements = loadFromClipboard();
        if (clipboardElements.length === 0) return;
        pushUndo(canvasDoc);
        const newElements = clipboardElements.map((el, index) => ({
          ...JSON.parse(JSON.stringify(el)),
          id: nanoid(8),
          groupId: undefined,
          x: el.x + 20,
          y: el.y + 20,
          zIndex: getNextZIndex(canvasDoc.elements) + index,
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
        if (propertiesPopup) {
          setPropertiesPopup(null);
        } else {
          setSelectedIds([]);
        }
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
      .filter((id) => {
        const el = canvasDoc.elements.find((e) => e.id === id);
        return el && !el.locked;
      })
      .map((id) => canvasRef.current?.querySelector(`[data-element-id="${id}"]`) as HTMLElement)
      .filter(Boolean);
  }, [selectedIds, canvasDoc.elements]);

  const getGuidelineElements = useCallback(() => {
    if (!canvasRef.current) return [];
    return canvasDoc.elements
      .filter(
        (el) =>
          el.visible !== false &&
          !el.locked &&
          !selectedIds.includes(el.id)
      )
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
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
            onClick={() => setShowProperties(!showProperties)}
          >
            {showProperties ? "Hide Properties" : "Show Properties"}
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
          {selectedIds.length > 1 && (
            <button
              className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
              onClick={groupSelected}
            >
              Group
            </button>
          )}
          {selectedIds.some((id) => canvasDoc.elements.find((el) => el.id === id)?.groupId) && (
            <button
              className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
              onClick={ungroupSelected}
            >
              Ungroup
            </button>
          )}
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
            onClick={() => setShowLayers(!showLayers)}
          >
            {showLayers ? "Hide Layers" : "Show Layers"}
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
            onClick={() => setShowTemplates("browse")}
          >
            📐 Templates
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
            onClick={() => setShowTemplates("manage")}
          >
            🗂 Manage Templates
          </button>
          <button
            className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
            onClick={() => setShowSaveModal(true)}
          >
            💾 Save Template
          </button>
          <PublishControls
            status={publishStatus}
            scheduledAt={scheduledAt}
            onStatusChange={(status, newScheduledAt) => {
              setPublishStatus(status);
              setScheduledAt(newScheduledAt);
              if (onStatusChange) {
                onStatusChange(status, newScheduledAt);
              }
            }}
          />
          <span className="text-xs text-gray-500 ml-auto">
            {canvasDoc.elements.length} elements
            {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ""}
            {` · ${saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save failed" : "Saved"}`}
          </span>
        </div>

        <div
          ref={(node) => { canvasRef.current = node; setContainerEl(node); }}
          className="relative mx-auto bg-white shadow-lg"
          style={{
            width: canvasDoc.canvas.width,
            height: canvasDoc.canvas.height,
            background: canvasDoc.canvas.background || "#fff",
          }}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest("[data-element-id]")) {
              setSelectedIds([]);
            }
          }}        >
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
                  transform: `rotate(${el.rotation}deg)`,
                  transformOrigin: "center center",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleElementSelect(el, e.shiftKey);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleElementSelect(el, false);
                  setPropertiesPopup({
                    x: Math.max(8, Math.min(e.clientX, window.innerWidth - 290)),
                    y: Math.max(8, Math.min(e.clientY, window.innerHeight - 420)),
                    locked: false,
                  });
                }}
              >
                {renderElement(el, updateElement, pushUndo, canvasDoc)}
                {el.locked === true && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center text-white text-xs z-10">
                    🔒
                  </span>
                )}
              </div>
            ))}
        {containerEl && (() => {
          const moveableTargets = getTargetElements();
          return moveableTargets.length > 0 ? (
            <Moveable
              key="moveable-ready"
              ref={moveableRef}
              target={moveableTargets}
              container={containerEl}
              rootContainer={containerEl}
              draggable={true}
              resizable={true}
              rotatable={true}
              snappable={true}
              elementGuidelines={getGuidelineElements()}
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
                onResize={({ target, width, height, drag }) => {
                  target.style.width = `${width}px`;
                  target.style.height = `${height}px`;
                  target.style.left = `${drag.left}px`;
                  target.style.top = `${drag.top}px`;
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
          ) : null;
        })()}
        </div>

        {showLayers && (
          <LayersPanel
            elements={canvasDoc.elements}
            selectedIds={selectedIds}
            onSelect={setSelectedIds}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onRename={renameElement}
          />
        )}

        {showProperties && selectedIds.length === 1 && !propertiesPopup && (
          <PropertiesPanel
            element={canvasDoc.elements.find((el) => el.id === selectedIds[0])!}
            onUpdate={updateElement}
            onDelete={deleteSelected}
            onDuplicate={duplicateSelected}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
          />
        )}

        {showTemplates && (
          <TemplateManager
            contentType={contentType}
            mode={showTemplates}
            onClose={() => setShowTemplates(null)}
            onApply={(template) => {
              if (template) {
                if (
                  canvasDoc.elements.length > 0 &&
                  !confirm("Replace current canvas with this template? (You can undo)")
                ) {
                  return;
                }
                try {
                  const doc = JSON.parse(template.layoutData);
                  if (doc.schemaVersion === 1 && Array.isArray(doc.elements)) {
                    pushUndo(canvasDoc);
                    setRedoStack([]);
                    setCanvasDoc(doc);
                    setSelectedIds([]);
                  }
                } catch {
                  // invalid template
                }
              }
              setShowTemplates(null);
            }}
          />
        )}

        {showSaveModal && (
          <SaveTemplateModal
            contentType={contentType}
            onSave={saveAsTemplate}
            onClose={() => setShowSaveModal(false)}
          />
        )}

                {/* Properties Popup */}
        {propertiesPopup && selectedIds.length === 1 && (() => {
          const selectedElement = canvasDoc.elements.find((el) => el.id === selectedIds[0]);
          if (!selectedElement) return null;

          return (
            <div
              ref={popupRef}
              className="fixed z-50"
              style={{
                left: propertiesPopup.x,
                top: propertiesPopup.y,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border border-gray-200 rounded-lg shadow-xl">
                <div
                  className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 ${
                    isDraggingPopup ? "cursor-grabbing" : "cursor-grab"
                  }`}
                  onMouseDown={handlePopupDragStart}
                >
                  <span className="text-xs font-semibold text-gray-600">Properties</span>
                  <div className="flex items-center gap-2">
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => setPropertiesPopup(prev => prev ? { ...prev, locked: !prev.locked } : null)}
                      className={`text-xs ${propertiesPopup.locked ? "text-emerald-600" : "text-gray-400"}`}
                      title={propertiesPopup.locked ? "Unlock" : "Lock"}
                    >
                      📌
                    </button>
                    <button
                      onClick={() => setPropertiesPopup(null)}
                      className="text-gray-400 hover:text-gray-600 text-lg"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="max-h-[70vh] overflow-y-auto">
                  <PropertiesPanel
                    element={selectedElement}
                    onUpdate={updateElement}
                    onDelete={deleteSelected}
                    onDuplicate={duplicateSelected}
                    onBringForward={bringForward}
                    onSendBackward={sendBackward}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Context Menu */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
            onGroup={groupSelected}
            onUngroup={ungroupSelected}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onShowProperties={handleShowProperties}
            canGroup={selectedIds.length > 1}
            canUngroup={selectedIds.some((id) => canvasDoc.elements.find((el) => el.id === id)?.groupId)}
          />
        )}


        {showUndoToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
            Elements deleted —{" "}
            <button onClick={undo} className="underline hover:text-emerald-300">
              Undo
            </button>
          </div>
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
    case "shape":
      return <ShapeElementView element={el} />;
    case "list":
    case "checklist":
    case "proscons":
      return (
        <SmartBlockElementView
          element={el}
          onUpdate={update}
          onBeginEdit={() => pushUndo(canvasDoc)}
        />
      );
    case "button":
      return (
        <ButtonElementView
          element={el}
          onUpdate={update}
          onBeginEdit={() => pushUndo(canvasDoc)}
        />
      );
    case "pdf":
      return <PdfElementView element={el} />;
    case "portal_dates":
      return <PortalDatesElementView element={el} />;
    case "portal_notices":
      return <PortalNoticesElementView element={el} />;
    case "portal_documents":
      return <PortalDocumentsElementView element={el} />;
    case "portal_faqs":
      return <PortalFaqsElementView element={el} />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded text-gray-400 text-sm">
          {el.type}
        </div>
      );
  }
}
