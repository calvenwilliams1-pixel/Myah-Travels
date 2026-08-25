"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import CanvasEditor from "@/components/editor/canvas/CanvasEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getGuideAction, updateGuideAction } from "../actions";
import { EditorMode } from "@/types/canvas";

type GuideStatus = "draft" | "published" | "hidden";

export default function EditGuidePage() {
  const params = useParams();
  const router = useRouter();
  const guideId = Number(params.id);

  const [mode, setMode] = useState<EditorMode>("story");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [quickReference, setQuickReference] = useState("");
  const [status, setStatus] = useState<GuideStatus>("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGuide() {
      if (Number.isNaN(guideId)) {
        setIsLoading(false);
        return;
      }

      try {
        const guide = await getGuideAction(guideId);
        if (guide) {
          setTitle(guide.title);
          setContent(guide.content);
          setExcerpt(guide.excerpt || "");
          setQuickReference(guide.quickReference || "");

          if (guide.status === "draft" || guide.status === "published" || guide.status === "hidden") {
            setStatus(guide.status);
          }

          if (guide.mode === "story" || guide.mode === "design") {
            setMode(guide.mode);
          } else {
            setMode("story");
          }
        }
      } catch (err) {
        console.error("Failed to load guide:", err);
        setError("Failed to load guide");
      } finally {
        setIsLoading(false);
      }
    }
    loadGuide();
  }, [guideId]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const result = await updateGuideAction(guideId, {
        title,
        content,
        excerpt,
        quickReference,
        status,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Failed to save guide:", err);
      setError("Failed to save guide");
    } finally {
      setIsSaving(false);
    }
  }

  if (Number.isNaN(guideId)) {
    return <div className="p-6 text-red-600">Invalid guide ID</div>;
  }

  if (isLoading) {
    return <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Edit Guide ({mode === "story" ? "📝 Story" : "🎨 Design"})
        </h2>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()}>Back</Button>
          <Button onClick={handleSave} isLoading={isSaving}>Save</Button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Card>
        <Input
          label="Title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Card>

      <Card>
        <Input
          label="Excerpt (optional)"
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
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
            initialContent={content}
            onChange={(_html, json) => setContent(JSON.stringify(json))}
            contentType="guide"
          />
        ) : (
          <CanvasEditor
            initialDocument={content}
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
