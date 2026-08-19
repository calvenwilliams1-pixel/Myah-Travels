"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getReviewAction, updateReviewAction } from "../actions";

export default function EditReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = Number(params.id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewType, setReviewType] = useState("product");
  const [ratingOverall, setRatingOverall] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [status, setStatus] = useState("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadReview() {
      const review = await getReviewAction(reviewId);
      if (review) {
        setTitle(review.title);
        setContent(review.content);
        setReviewType(review.reviewType);
        setRatingOverall(review.ratingOverall || 0);
        setWouldRecommend(review.wouldRecommend || "");
        setPros(review.pros || "");
        setCons(review.cons || "");
        setStatus(review.status);
      }
      setIsLoading(false);
    }
    loadReview();
  }, [reviewId]);

  async function handleSave() {
    setIsSaving(true);
    await updateReviewAction(reviewId, {
      title,
      content,
      reviewType,
      ratingOverall,
      wouldRecommend,
      pros,
      cons,
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
        <h2 className="text-2xl font-semibold">Edit Review</h2>
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
