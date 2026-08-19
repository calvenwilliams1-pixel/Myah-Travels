"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getGuideAction, updateGuideAction } from "../actions";

export default function EditGuidePage() {
  const params = useParams();
  const router = useRouter();
  const guideId = Number(params.id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [quickReference, setQuickReference] = useState("");
  const [status, setStatus] = useState("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadGuide() {
      const guide = await getGuideAction(guideId);
      if (guide) {
        setTitle(guide.title);
        setContent(guide.content);
        setExcerpt(guide.excerpt || "");
        setQuickReference(guide.quickReference || "");
        setStatus(guide.status);
      }
      setIsLoading(false);
    }
    loadGuide();
  }, [guideId]);

  async function handleSave() {
    setIsSaving(true);
    await updateGuideAction(guideId, {
      title,
      content,
      excerpt,
      quickReference,
      status,
    });
    setIsSaving(false);
    router.refresh();
  }

  if (isLoading) {
    return <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Edit Guide</h2>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()}>Back</Button>
          <Button onClick={handleSave} isLoading={isSaving}>Save</Button>
        </div>
      </div>

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
        <TipTapEditor
          initialContent={content}
          onChange={(html, json) => setContent(json)}
        />
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
