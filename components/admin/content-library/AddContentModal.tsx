"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AddContentModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["guide", "checklist", "faq", "alert", "document", "other"];

export default function AddContentModal({ onClose, onSaved }: AddContentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("pdf");
  const [category, setCategory] = useState("guide");
  const [textContent, setTextContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    let filePath: string | undefined;

    if (type !== "text" && file) {
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
    }

    const body: any = {
      title,
      description: description || undefined,
      type,
      category,
      filePath,
      textContent: type === "text" ? textContent : undefined,
    };

    const res = await fetch("/api/content-library", {
      method: "POST",
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
        <h3 className="text-lg font-semibold mb-4">Add Content</h3>

        <div className="space-y-4">
          <Input
            label="Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Disney Packing Guide"
          />

          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What to bring for Florida weather"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-3">
              {["pdf", "image", "text"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    type === t ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

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

          {type !== "text" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload {type.toUpperCase()}
              </label>
              <input
                type="file"
                accept={type === "pdf" ? ".pdf" : "image/*"}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter content..."
              />
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
