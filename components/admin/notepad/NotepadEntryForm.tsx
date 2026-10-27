"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import TagInput from "@/components/editor/TagInput";

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <TagInput
          selectedTags={tags}
          onAddTag={(tag) => setTags([...tags, tag])}
          onRemoveTag={(tag) => setTags(tags.filter((t) => t !== tag))}
          placeholder="Add tag (name or keyword)"
          autocompleteSource={autocompleteSource}
        />
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
