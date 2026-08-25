"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import CanvasEditor from "@/components/editor/canvas/CanvasEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getReviewAction, updateReviewAction } from "../actions";
import { EditorMode } from "@/types/canvas";

type ReviewStatus = "draft" | "published" | "hidden";
type ReviewType = "product" | "hotel" | "cruise" | "resort" | "excursion";
type Recommendation = "yes" | "no" | "depends" | "";

export default function EditReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = Number(params.id);

  const [mode, setMode] = useState<EditorMode>("story");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewType, setReviewType] = useState<ReviewType>("product");
  const [ratingOverall, setRatingOverall] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<Recommendation>("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReview() {
      if (Number.isNaN(reviewId)) {
        setIsLoading(false);
        return;
      }

      try {
        const review = await getReviewAction(reviewId);
        if (review) {
          setTitle(review.title);
          setContent(review.content);
          if (review.reviewType === "product" || review.reviewType === "hotel" || review.reviewType === "cruise" || review.reviewType === "resort" || review.reviewType === "excursion") {
            setReviewType(review.reviewType);
          }
          setRatingOverall(review.ratingOverall || 0);
          if (review.wouldRecommend === "yes" || review.wouldRecommend === "no" || review.wouldRecommend === "depends") {
            setWouldRecommend(review.wouldRecommend);
          } else {
            setWouldRecommend("");
          }
          setPros(review.pros || "");
          setCons(review.cons || "");

          if (review.status === "draft" || review.status === "published" || review.status === "hidden") {
            setStatus(review.status);
          }

          if (review.mode === "story" || review.mode === "design") {
            setMode(review.mode);
          } else {
            setMode("story");
          }
        }
      } catch (err) {
        console.error("Failed to load review:", err);
        setError("Failed to load review");
      } finally {
        setIsLoading(false);
      }
    }
    loadReview();
  }, [reviewId]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (ratingOverall < 0 || ratingOverall > 5) {
      setError("Rating must be between 0 and 5");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const result = await updateReviewAction(reviewId, {
        title,
        content,
        reviewType,
        ratingOverall,
        wouldRecommend,
        pros,
        cons,
        status,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Failed to save review:", err);
      setError("Failed to save review");
    } finally {
      setIsSaving(false);
    }
  }

  if (Number.isNaN(reviewId)) {
    return <div className="p-6 text-red-600">Invalid review ID</div>;
  }

  if (isLoading) {
    return <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Edit Review ({mode === "story" ? "📝 Story" : "🎨 Design"})
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Review Type
        </label>
        <select
          value={reviewType}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "product" || value === "hotel" || value === "cruise" || value === "resort" || value === "excursion") {
              setReviewType(value);
            }
          }}
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
          onChange={(e) => {
            const value = Number(e.target.value);
            if (!Number.isNaN(value)) {
              setRatingOverall(value);
            }
          }}
        />
      </Card>   
      
      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Would Recommend
        </label>
        <select
          value={wouldRecommend}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "" || value === "yes" || value === "no" || value === "depends") {
              setWouldRecommend(value);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select...</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="depends">Depends</option>
        </select>
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pros (one per line)
        </label>
        <textarea
          value={pros}
          onChange={(e) => setPros(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cons (one per line)
        </label>
        <textarea
          value={cons}
          onChange={(e) => setCons(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[100px]"
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
            contentType="review"
          />
        ) : (
          <CanvasEditor
            initialDocument={content}
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
