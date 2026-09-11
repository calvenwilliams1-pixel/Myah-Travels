"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface NotepadEntryFormProps {
  portalId: number;
  autocompleteSource: string[];
  onSaved: () => void;
}

export default function NotepadEntryForm({
  portalId,
  autocompleteSource,
  onSaved,
}: NotepadEntryFormProps) {
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag() {
    const trimmed = currentTag.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setCurrentTag("");
      return;
    }
    setTags([...tags, trimmed]);
    setCurrentTag("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!content.trim()) {
      setError("Content is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const res = await fetch(`/api/portal/${portalId}/notepad`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content.trim(),
        tags: tags.length > 0 ? tags.join(", ") : null,
      }),
    });

    const data = await res.json();

    if (data.success) {
      setContent("");
      setTags([]);
      setCurrentTag("");
      onSaved();
    } else {
      setError(data.error || "Failed to save");
    }

    setIsSaving(false);
  }

  return (
    <Card>
      <h3 className="font-semibold mb-3">Add Note</h3>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="e.g., September 30 onsen trip - Emma, John, Grandma attending"
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
      />

      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-primary hover:text-primary-dark"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag (name or keyword)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            list="notepad-tag-suggestions"
          />
          <datalist id="notepad-tag-suggestions">
            {autocompleteSource.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
          <Button variant="secondary" onClick={addTag}>Add Tag</Button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <div className="mt-3 flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !content.trim()}>
          {isSaving ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </Card>
  );
}
