"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import TipTapEditor from "@/components/editor/TipTapEditor";
import CanvasEditor from "@/components/editor/canvas/CanvasEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getPostAction, updatePostAction, getPostTagsAction } from "../actions";
import TagInput from "@/components/editor/TagInput";

import { EditorMode } from "@/types/canvas";

type PostStatus = "draft" | "published" | "hidden";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);

  const [mode, setMode] = useState<EditorMode>("story");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    async function loadPost() {
      try {
        const post = await getPostAction(postId);
        if (post) {
          setTitle(post.title);
          setContent(post.content);
          setExcerpt(post.excerpt || "");
          const postTags = await getPostTagsAction(postId);
          setTags(postTags);
          if (post.status === "draft" || post.status === "published" || post.status === "hidden") {
          setStatus(post.status);
          }
          if (post.mode === "story" || post.mode === "design") {
            setMode(post.mode);
          } else {
            setMode("story");
          }
        }
      } catch (err) {
        console.error("Failed to load post:", err);
        setError("Failed to load post");
      }
      setIsLoading(false);
    }
    loadPost();
  }, [postId]);

  async function handleSave() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const result = await updatePostAction(postId, {
        title,
        content,
        excerpt,
        status,
        tagNames: tags,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Failed to save post:", err);
      setError("Failed to save post");
    } finally {
      setIsSaving(false);
    }
  }

  if (Number.isNaN(postId)) {
    return <div className="p-6 text-red-600">Invalid post ID</div>;
  }

  if (isLoading) {
    return <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">
          Edit Post ({mode === "story" ? "📝 Story" : "🎨 Design"})
        </h2>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save
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
        <Input
          label="Excerpt (optional)"
          name="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <TagInput
          selectedTags={tags}
          onAddTag={(tag) => setTags([...tags, tag])}
          onRemoveTag={(tag) => setTags(tags.filter((t) => t !== tag))}
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
            contentType="post"
          />
        ) : (
          <CanvasEditor
            initialDocument={content}
            contentType="post"
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
