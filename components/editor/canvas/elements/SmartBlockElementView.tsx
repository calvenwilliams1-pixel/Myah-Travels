"use client";

import React, { useState } from "react";
import { CanvasElement, ChecklistItem } from "@/types/canvas";
import { nanoid } from "nanoid";

interface SmartBlockElementViewProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onBeginEdit?: () => void;
}

export default function SmartBlockElementView({ element, onUpdate, onBeginEdit }: SmartBlockElementViewProps) {
  const [isEditing, setIsEditing] = useState(false);

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // ============ LIST ============
  if (element.type === "list") {
    const items = (element.items as string[]) || [];
    const listStyle = element.listType === "numbered" ? "decimal" : (element.bulletStyle || "disc");

    if (isEditing) {
      return (
        <div onMouseDown={stopPropagation}>
          <ListEditor
            items={items}
            onSave={(newItems) => {
              onUpdate(element.id, { items: newItems });
              setIsEditing(false);
            }}
          />
        </div>
      );
    }

    return (
      <div
        className="w-full h-full cursor-text p-2 overflow-auto"
        onMouseDown={stopPropagation}
        onDoubleClick={() => {
          if (onBeginEdit) onBeginEdit();
          setIsEditing(true);
        }}
      >
        <ul className="pl-5 space-y-1" style={{ listStyleType: listStyle }}>
          {items.map((item, i) => (
            <li key={i} className="text-sm" style={{ color: element.color || "#333" }}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ============ CHECKLIST ============
  if (element.type === "checklist") {
    const items = (element.items as ChecklistItem[]) || [];

    if (isEditing) {
      return (
        <div onMouseDown={stopPropagation}>
          <ChecklistEditor
            items={items}
            onSave={(newItems) => {
              onUpdate(element.id, { items: newItems });
              setIsEditing(false);
            }}
          />
        </div>
      );
    }

    return (
      <div
        className="w-full h-full cursor-text p-2 overflow-auto"
        onMouseDown={stopPropagation}
        onDoubleClick={() => {
          if (onBeginEdit) onBeginEdit();
          setIsEditing(true);
        }}
      >
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 text-sm" style={{ color: element.color || "#333" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const updated = items.map((it) =>
                    it.id === item.id ? { ...it, checked: !it.checked } : it
                  );
                  onUpdate(element.id, { items: updated });
                }}
                className={`w-4 h-4 border border-gray-400 rounded flex items-center justify-center text-xs flex-shrink-0 ${
                  item.checked ? "bg-emerald-500 border-emerald-500 text-white" : ""
                }`}
              >
                {item.checked ? "✓" : ""}
              </button>
              <span className={item.checked ? "line-through text-gray-400" : ""}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============ PROS/CONS ============
  if (element.type === "proscons") {
    const pros = (element.pros as string[]) || [];
    const cons = (element.cons as string[]) || [];

    if (isEditing) {
      return (
        <div onMouseDown={stopPropagation}>
          <ProsConsEditor
            pros={pros}
            cons={cons}
            onSave={(newPros, newCons) => {
              onUpdate(element.id, { pros: newPros, cons: newCons });
              setIsEditing(false);
            }}
          />
        </div>
      );
    }

    return (
      <div
        className="w-full h-full cursor-text p-2 overflow-auto"
        onMouseDown={stopPropagation}
        onDoubleClick={() => {
          if (onBeginEdit) onBeginEdit();
          setIsEditing(true);
        }}
      >
        <div className="grid grid-cols-2 gap-3 h-full">
          <div>
            <p className="text-xs font-semibold text-emerald-700 mb-1">PROS</p>
            <ul className="space-y-1">
              {pros.map((pro, i) => (
                <li key={i} className="text-sm" style={{ color: element.color || "#333" }}>
                  + {pro}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 mb-1">CONS</p>
            <ul className="space-y-1">
              {cons.map((con, i) => (
                <li key={i} className="text-sm" style={{ color: element.color || "#333" }}>
                  − {con}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ============ EDITORS ============

function ListEditor({ items, onSave }: { items: string[]; onSave: (items: string[]) => void }) {
  const [draft, setDraft] = useState<string[]>(items);

  return (
    <div className="w-full h-full p-2 bg-white border border-emerald-300 rounded overflow-auto">
      <div className="space-y-1 mb-2">
        {draft.map((item, i) => (
          <div key={i} className="flex gap-1">
            <input
              value={item}
              onChange={(e) => {
                const next = [...draft];
                next[i] = e.target.value;
                setDraft(next);
              }}
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
            />
            <button
              onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}
              className="px-1 text-red-500 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setDraft([...draft, ""])}
          className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
        >
          + Add Item
        </button>
        <button
          onClick={() => {
            const cleaned = draft.filter((d) => d.trim() !== "");
            onSave(cleaned.length > 0 ? cleaned : ["Item"]);
          }}
          className="px-3 py-1 bg-emerald-700 text-white rounded text-xs"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ChecklistEditor({ items, onSave }: { items: ChecklistItem[]; onSave: (items: ChecklistItem[]) => void }) {
  const [draft, setDraft] = useState<ChecklistItem[]>(items);

  return (
    <div className="w-full h-full p-2 bg-white border border-emerald-300 rounded overflow-auto">
      <div className="space-y-1 mb-2">
        {draft.map((item, i) => (
          <div key={item.id} className="flex gap-1">
            <input
              value={item.text}
              onChange={(e) => {
                const next = [...draft];
                next[i] = { ...next[i], text: e.target.value };
                setDraft(next);
              }}
              className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
            />
            <button
              onClick={() => setDraft(draft.filter((_, idx) => idx !== i))}
              className="px-1 text-red-500 text-xs"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setDraft([...draft, { id: nanoid(6), text: "", checked: false }])}
          className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
        >
          + Add Item
        </button>
        <button
          onClick={() => {
            const cleaned = draft.filter((d) => d.text.trim() !== "");
            onSave(cleaned.length > 0 ? cleaned : [{ id: nanoid(6), text: "Task", checked: false }]);
          }}
          className="px-3 py-1 bg-emerald-700 text-white rounded text-xs"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function ProsConsEditor({
  pros,
  cons,
  onSave,
}: {
  pros: string[];
  cons: string[];
  onSave: (pros: string[], cons: string[]) => void;
}) {
  const [draftPros, setDraftPros] = useState<string[]>(pros);
  const [draftCons, setDraftCons] = useState<string[]>(cons);

  return (
    <div className="w-full h-full p-2 bg-white border border-emerald-300 rounded overflow-auto">
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <p className="text-xs font-semibold text-emerald-700 mb-1">PROS</p>
          {draftPros.map((pro, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <input
                value={pro}
                onChange={(e) => {
                  const next = [...draftPros];
                  next[i] = e.target.value;
                  setDraftPros(next);
                }}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
              />
              <button onClick={() => setDraftPros(draftPros.filter((_, idx) => idx !== i))} className="px-1 text-red-500 text-xs">✕</button>
            </div>
          ))}
          <button onClick={() => setDraftPros([...draftPros, ""])} className="px-2 py-1 bg-gray-100 rounded text-xs">+ Pro</button>
        </div>
        <div>
          <p className="text-xs font-semibold text-red-600 mb-1">CONS</p>
          {draftCons.map((con, i) => (
            <div key={i} className="flex gap-1 mb-1">
              <input
                value={con}
                onChange={(e) => {
                  const next = [...draftCons];
                  next[i] = e.target.value;
                  setDraftCons(next);
                }}
                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
              />
              <button onClick={() => setDraftCons(draftCons.filter((_, idx) => idx !== i))} className="px-1 text-red-500 text-xs">✕</button>
            </div>
          ))}
          <button onClick={() => setDraftCons([...draftCons, ""])} className="px-2 py-1 bg-gray-100 rounded text-xs">+ Con</button>
        </div>
      </div>
      <button
        onClick={() => {
          const cleanPros = draftPros.filter((p) => p.trim() !== "");
          const cleanCons = draftCons.filter((c) => c.trim() !== "");
          onSave(
            cleanPros.length > 0 ? cleanPros : ["Pro"],
            cleanCons.length > 0 ? cleanCons : ["Con"]
          );
        }}
        className="px-3 py-1 bg-emerald-700 text-white rounded text-xs"
      >
        Save
      </button>
    </div>
  );
}
