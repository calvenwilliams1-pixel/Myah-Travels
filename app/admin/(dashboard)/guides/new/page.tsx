"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import CanvasEditor from "@/components/editor/canvas/CanvasEditor";
import ModeSelectorModal from "@/components/editor/ModeSelectorModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createGuideAction } from "../actions";
import { EditorMode } from "@/types/canvas";

type GuideStatus = "draft" | "published" | "hidden";

export default function NewGuidePage() {
  const router = useRouter();
  const [mode, setMode] = useState<EditorMode | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [quickReference, setQuickReference] = useState("");
  const [status, setStatus] = useState<GuideStatus>("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const result = await createGuideAction({
        title,
        content,
        excerpt,
        quickReference,
        status,
        mode: mode || "story",
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.guideId) {
        router.push(`/admin/guides/${result.guideId}`);
      }
    } catch (err) {
      console.error("Failed to save guide:", err);
      setError("Failed to save guide. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!mode) {
    return <ModeSelectorModal onSelect={setMode} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          New Guide ({mode === "story" ? "📝 Story" : "🎨 Design"})
        </h2>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            {status === "published" ? "Publish" : "Save Draft"}
          </Button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Card>
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Guide title"
        />
      </Card>

      <Card>
        <Input
          label="Excerpt (optional)"
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short summary"
        />
      </Card>

      <Card>
        <Input
          label="Quick Reference (Best time, Currency, Language, etc.)"
          name="quickReference"
          value={quickReference}
          onChange={(e) => setQuickReference(e.target.value)}
          placeholder="JSON or plain text"
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>

        {mode === "story" ? (
          <TipTapEditor
            onChange={(_html, json) => setContent(JSON.stringify(json))}
            contentType="guide"
          />
        ) : (
          <CanvasEditor
            contentType="guide"
            onSave={async (docJson) => setContent(JSON.stringify(docJson))}
          />
        )}
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "draft" || value === "published" || value === "hidden") {
              setStatus(value);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
      </Card>
    </div>
  );
}
