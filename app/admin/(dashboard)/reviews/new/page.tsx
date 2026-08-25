"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import CanvasEditor from "@/components/editor/canvas/CanvasEditor";
import ModeSelectorModal from "@/components/editor/ModeSelectorModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createReviewAction } from "../actions";
import { EditorMode } from "@/types/canvas";

type ReviewStatus = "draft" | "published" | "hidden";

export default function NewReviewPage() {
  const router = useRouter();
  const [mode, setMode] = useState<EditorMode | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewType, setReviewType] = useState("product");
  const [ratingOverall, setRatingOverall] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("draft");
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

      const result = await createReviewAction({
        title,
        content,
        reviewType,
        ratingOverall,
        wouldRecommend,
        pros,
        cons,
        status,
        mode: mode || "story",
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.reviewId) {
        router.push(`/admin/reviews/${result.reviewId}`);
      }
    } catch (err) {
      console.error("Failed to save review:", err);
      setError("Failed to save review. Please try again.");
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
          New Review ({mode === "story" ? "📝 Story" : "🎨 Design"})
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
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Type
        </label>
        <select
          value={reviewType}
          onChange={(e) => setReviewType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="product">Product</option>
          <option value="hotel">Hotel</option>
          <option value="cruise">Cruise</option>
          <option value="resort">Resort</option>
          <option value="excursion">Excursion</option>
        </select>
      </Card>

      <Card>
        <Input
          label="Overall Rating (0-5)"
          name="ratingOverall"
          type="number"
          min={0}
          max={5}
          step={0.5}
          value={ratingOverall}
          onChange={(e) => setRatingOverall(Number(e.target.value))}
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Would Recommend
        </label>
        <select
          value={wouldRecommend}
          onChange={(e) => setWouldRecommend(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select...</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="depends">Depends</option>
        </select>
      </Card>

      <Card>
        <Input
          label="Pros (one per line)"
          name="pros"
          value={pros}
          onChange={(e) => setPros(e.target.value)}
        />
      </Card>

      <Card>
        <Input
          label="Cons (one per line)"
          name="cons"
          value={cons}
          onChange={(e) => setCons(e.target.value)}
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>

        {mode === "story" ? (
          <TipTapEditor
            onChange={(_html, json) => setContent(JSON.stringify(json))}
            contentType="review"
          />
        ) : (
          <CanvasEditor
            contentType="review"
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
