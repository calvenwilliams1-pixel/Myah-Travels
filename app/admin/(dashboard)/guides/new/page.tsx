"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createGuideAction } from "../actions";

export default function NewGuidePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [quickReference, setQuickReference] = useState("");
  const [status, setStatus] = useState("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    const result = await createGuideAction({
      title,
      content,
      excerpt,
      quickReference,
      status,
    });

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    if (result.guideId) {
      router.push(`/admin/guides/${result.guideId}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">New Guide</h2>
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
        <TipTapEditor onChange={(html, json) => setContent(json)} />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
