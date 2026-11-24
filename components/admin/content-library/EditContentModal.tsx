"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import TipTapEditor from "@/components/editor/TipTapEditor";

export interface EditableLibraryItem {
  id: number;
  title: string;
  description: string | null;
  type: string;
  category: string | null;
  filePath: string | null;
  textContent: string | null;
}

interface EditContentModalProps {
  item: EditableLibraryItem;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["guide", "checklist", "faq", "alert", "document", "other"];

/**
 * Edit a library item in place — title, description, category, its
 * written content, or a replacement file. Portals showing this item
 * pick the changes up on their own, because walls read the library
 * live. (Before this existed, the only route was delete + recreate +
 * re-attach everywhere.)
 */
export default function EditContentModal({ item, onClose, onSaved }: EditContentModalProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [category, setCategory] = useState(item.category ?? "guide");
  const [textContent, setTextContent] = useState(item.textContent ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isText = item.type === "text";

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setIsSaving(true);
    setError(null);

    let filePath: string | undefined;
    let type: string | undefined;

    if (!isText && file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "library");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        setError("Upload failed");
        setIsSaving(false);
        return;
      }
      filePath = uploadData.filePath;
      type = file.type.startsWith("image/") ? "image" : "pdf";
    }

    const body: Record<string, unknown> = {
      title,
      description: description || undefined,
      type: type ?? item.type,
      category,
      filePath,
      textContent: isText ? textContent : undefined,
    };

    const res = await fetch(`/api/content-library/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (data.success) {
      onSaved();
    } else {
      setError(data.error || "Save failed");
    }
    setIsSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Content</h3>

        <div className="space-y-4">
          <Input
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {isText ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <div className="border border-gray-300 rounded-lg overflow-hidden [&_.ProseMirror]:min-h-[160px]">
                <TipTapEditor
                  initialContent={item.textContent ?? ""}
                  onChange={(html) => setTextContent(html)}
                  placeholder="Write the document or note..."
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Replace file (optional)
              </label>
              {item.filePath && (
                <p className="text-xs text-gray-500 mb-1">
                  Current: {item.filePath.split("/").pop()}
                </p>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to keep the current file. Portals update automatically.
              </p>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
