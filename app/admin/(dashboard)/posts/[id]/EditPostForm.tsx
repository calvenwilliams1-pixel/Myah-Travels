"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BlockEditor from "@/components/editor/blocks/BlockEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getPostAction, updatePostAction, getPostTagsAction } from "../actions";
import TagInput from "@/components/editor/TagInput";
import type { Template, BlockData } from "@/types/blocks";

type PostStatus = "draft" | "published" | "hidden";

interface EditPostFormProps {
  postId: number;
  templates: Template[];
}

interface BlockContentShape {
  blocks: BlockData[];
  templateId: string;
}

function parseContent(raw: string): BlockContentShape {
  if (!raw || !raw.trim()) {
    return { blocks: [], templateId: "story" };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.blocks)) {
      return {
        blocks: parsed.blocks,
        templateId: parsed.templateId ?? "story",
      };
    }
  } catch {
    // Not JSON — legacy TipTap content or plain text. Start fresh.
  }
  return { blocks: [], templateId: "story" };
}

export default function EditPostForm({ postId, templates }: EditPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [templateId, setTemplateId] = useState("story");
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
          const shape = parseContent(post.content);
          setBlocks(shape.blocks);
          setTemplateId(shape.templateId);
          setContent(post.content);
          setExcerpt(post.excerpt || "");
          const postTags = await getPostTagsAction(postId);
          setTags(postTags);
          if (
            post.status === "draft" ||
            post.status === "published" ||
            post.status === "hidden"
          ) {
            setStatus(post.status);
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

  if (isLoading) {
    return <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Edit Post</h2>
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
        <BlockEditor
          templates={templates}
          initialBlocks={blocks}
          initialTemplateId={templateId}
          onChange={(newBlocks, newTemplateId) => {
            setBlocks(newBlocks);
            setTemplateId(newTemplateId);
            setContent(JSON.stringify({ blocks: newBlocks, templateId: newTemplateId }));
          }}
        />
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
