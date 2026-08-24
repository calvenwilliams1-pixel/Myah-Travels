"use client";

import React, { useState, useEffect } from "react";

interface CanvasTemplate {
  id: number;
  name: string;
  contentType: string;
  isBuiltIn: boolean;
  layoutData: string;
  createdAt?: string;
}

interface TemplateManagerProps {
  contentType: string;
  mode: "browse" | "manage";
  onClose: () => void;
  onApply: (template: CanvasTemplate | null) => void;
}

export default function TemplateManager({ contentType, mode, onClose, onApply }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<CanvasTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplates() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/canvas/templates?type=${contentType}`);
        const data = await res.json();
        if (!cancelled) {
          setTemplates(data.templates || []);
        }
      } catch (err) {
        console.error("Failed to load templates:", err);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    }

    fetchTemplates();

    return () => {
      cancelled = true;
    };
  }, [contentType]);

  async function refreshTemplates() {
    const res = await fetch(`/api/canvas/templates?type=${contentType}`);
    const data = await res.json();
    setTemplates(data.templates || []);
  }

  async function handleDelete(id: number) {
    if (pendingId) return;
    setPendingId(id);
    try {
      const res = await fetch(`/api/canvas/templates/${id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshTemplates();
      } else {
        alert("Delete failed");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
    setPendingId(null);
  }

  async function handleDuplicate(id: number) {
    if (pendingId) return;
    setPendingId(id);
    try {
      const res = await fetch(`/api/canvas/templates/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await refreshTemplates();
      } else {
        alert("Duplicate failed");
      }
    } catch (err) {
      console.error("Duplicate failed:", err);
    }
    setPendingId(null);
  }

  const title = mode === "browse" ? "Choose a Template" : "Manage Templates";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-1">
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <div className="space-y-4">
              {mode === "browse" && (
                <button
                  onClick={() => onApply(null)}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors"
                >
                  <span className="text-3xl">📄</span>
                  <p className="font-medium mt-2">Blank Canvas</p>
                  <p className="text-xs text-gray-500">Start from scratch</p>
                </button>
              )}

              {templates.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No templates for {contentType} yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      className={`border-2 border-gray-200 rounded-lg p-6 text-center transition-colors ${
                        mode === "browse" ? "hover:border-emerald-500 cursor-pointer" : ""
                      }`}
                      onClick={() => {
                        if (mode === "browse") onApply(template);
                      }}
                    >
                      <span className="text-3xl">
                        {template.isBuiltIn ? "⭐" : "📐"}
                      </span>
                      <p className="font-medium mt-2">{template.name}</p>
                      <p className="text-xs text-gray-500">
                        {template.isBuiltIn
                          ? "Built-in"
                          : `Created ${template.createdAt ? new Date(template.createdAt).toLocaleDateString() : "—"}`}
                      </p>

                      {mode === "manage" && (
                        <div className="flex gap-2 mt-3 justify-center">
                          <button
                            onClick={() => onApply(template)}
                            className="px-3 py-1 bg-emerald-700 text-white rounded text-xs"
                            disabled={pendingId === template.id}
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handleDuplicate(template.id)}
                            className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
                            disabled={pendingId === template.id}
                          >
                            {pendingId === template.id ? "..." : "Duplicate"}
                          </button>
                          {!template.isBuiltIn && (
                            <button
                              onClick={() => handleDelete(template.id)}
                              className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs hover:bg-red-100"
                              disabled={pendingId === template.id}
                            >
                              {pendingId === template.id ? "..." : "Delete"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
