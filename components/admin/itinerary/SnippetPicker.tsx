"use client";

import React, { useEffect, useRef, useState } from "react";

interface Snippet {
  id: number;
  title: string;
  content: string;
  useCount: number;
}

interface SnippetPickerProps {
  onInsert: (content: string) => void;
}

export default function SnippetPicker({ onInsert }: SnippetPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveContent, setSaveContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowSaveForm(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function load() {
    setIsLoading(true);
    const res = await fetch("/api/suggestions/snippets");
    const data = await res.json();
    setSnippets(data.snippets || []);
    setIsLoading(false);
  }

  function open() {
    setIsOpen(true);
    load();
  }

  async function useSnippet(s: Snippet) {
    onInsert(s.content);
    // Fire-and-forget bump
    void fetch("/api/suggestions/snippets/" + s.id, { method: "PATCH" }).catch(() => {});
    setIsOpen(false);
  }

  async function saveSnippet() {
    if (!saveTitle.trim() || !saveContent.trim()) return;
    setIsSaving(true);
    await fetch("/api/suggestions/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: saveTitle, content: saveContent }),
    });
    setIsSaving(false);
    setSaveTitle("");
    setSaveContent("");
    setShowSaveForm(false);
    await load();
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={open}
        className="text-xs text-gray-500 hover:text-gray-700"
        title="Insert a reusable snippet"
      >
        Snippets
      </button>

      {isOpen && (
        <div className="absolute z-30 right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
          {isLoading ? (
            <p className="text-xs text-gray-500 p-3">Loading...</p>
          ) : snippets.length === 0 && !showSaveForm ? (
            <div className="p-3">
              <p className="text-xs text-gray-500 mb-2">No snippets yet.</p>
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                className="text-xs text-primary hover:underline"
              >
                Create your first
              </button>
            </div>
          ) : showSaveForm ? (
            <div className="p-2 space-y-2">
              <input
                type="text"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                placeholder="Snippet title"
                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
              />
              <textarea
                value={saveContent}
                onChange={(e) => setSaveContent(e.target.value)}
                placeholder="Snippet content"
                rows={3}
                className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  className="text-xs text-gray-500 px-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSnippet}
                  disabled={isSaving || !saveTitle.trim() || !saveContent.trim()}
                  className="text-xs bg-primary text-white px-2 py-1 rounded disabled:opacity-50"
                >
                  {isSaving ? "..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {snippets.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => useSnippet(s)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10"
                  title={s.content}
                >
                  <span className="block font-medium">{s.title}</span>
                  <span className="block text-gray-400 truncate">{s.content}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowSaveForm(true)}
                className="w-full text-left px-3 py-2 text-xs text-primary border-t border-gray-100 hover:bg-primary/10"
              >
                + Create new snippet
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
