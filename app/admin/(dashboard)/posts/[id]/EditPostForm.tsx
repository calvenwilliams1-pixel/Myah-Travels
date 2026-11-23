"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import BlockEditor from "@/components/editor/blocks/BlockEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { getPostAction, updatePostAction, getPostTagsAction } from "../actions";
import TagInput from "@/components/editor/TagInput";
import type { Template, BlockData } from "@/types/blocks";
import { validateRequiredBlocks } from "@/lib/blocks/validate";
import { writeDraft, readDraft, clearDraft } from "@/lib/drafts";

type PostStatus = "draft" | "published" | "hidden";

type SaveTemplateFn = (
  template: Template,
  mode: "create" | "update"
) => Promise<{ ok: true; id: string } | { ok: false; error: string }>;

interface EditPostFormProps {
  postId: number;
  templates: Template[];
  onSaveAsTemplate?: SaveTemplateFn;
}

interface BlockContentShape {
  blocks: BlockData[];
  templateId: string;
}

interface PostSnapshot {
  title: string;
  content: string;
  excerpt: string;
  status: PostStatus;
  tags: string[];
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

export default function EditPostForm({ postId, templates, onSaveAsTemplate }: EditPostFormProps) {
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

  // Autosave state (added 2026-11-22: the post editor previously had no
  // autosave at all — a crash before Save lost the writing).
  const [isDirty, setIsDirty] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [pendingDraft, setPendingDraft] = useState<PostSnapshot | null>(null);
  const snapshotRef = useRef<string>("");
  const loadedRef = useRef(false);
  const draftKey = `post:${postId}:edit`;

  const currentSnapshot = (): PostSnapshot => ({
    title,
    content,
    excerpt,
    status,
    tags,
  });

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
          let loadedStatus: PostStatus = "draft";
          if (
            post.status === "draft" ||
            post.status === "published" ||
            post.status === "hidden"
          ) {
            loadedStatus = post.status;
            setStatus(post.status);
          }
          const loadedSnapshot: PostSnapshot = {
            title: post.title,
            content: post.content,
            excerpt: post.excerpt || "",
            status: loadedStatus,
            tags: postTags,
          };
          snapshotRef.current = JSON.stringify(loadedSnapshot);
          loadedRef.current = true;

          // Offer any browser draft that never made it to the server.
          const draft = readDraft<PostSnapshot>(draftKey);
          if (draft && JSON.stringify(draft) !== snapshotRef.current) {
            setPendingDraft(draft);
          }
        }
      } catch (err) {
        console.error("Failed to load post:", err);
        setError("Failed to load post");
      }
      setIsLoading(false);
    }
    loadPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function performSave(automatic: boolean): Promise<boolean> {
    if (!title.trim()) {
      if (!automatic) setError("Title is required");
      return false;
    }

    // Publish validation: all required blocks must be present and non-empty
    if (status === "published") {
      const currentTemplate = templates.find((t) => t.id === templateId) ?? null;
      const missing = validateRequiredBlocks(blocks, currentTemplate);
      if (missing.length > 0) {
        if (automatic) {
          setSaveNote(
            "Autosave paused — a published post needs its required blocks filled in."
          );
        } else {
          setError(
            `Cannot publish — required blocks are empty: ${missing.join(", ")}`
          );
        }
        return false;
      }
    }

    try {
      if (!automatic) setIsSaving(true);
      if (!automatic) setError(null);

      const result = await updatePostAction(postId, {
        title,
        content,
        excerpt,
        status,
        tagNames: tags,
      });

      if (result.error) {
        if (automatic) {
          setSaveNote("Autosave failed — your work is kept in this browser.");
        } else {
          setError(result.error);
        }
        return false;
      }

      snapshotRef.current = JSON.stringify(currentSnapshot());
      clearDraft(draftKey);
      setIsDirty(false);
      setSaveNote(
        `All changes saved · ${new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`
      );
      return true;
    } catch (err) {
      console.error("Failed to save post:", err);
      if (automatic) {
        setSaveNote("Autosave failed — your work is kept in this browser.");
      } else {
        setError("Failed to save post");
      }
      return false;
    } finally {
      if (!automatic) setIsSaving(false);
    }
  }

  async function handleSave() {
    const ok = await performSave(false);
    if (ok) router.refresh();
  }

  // Track dirtiness, keep a browser draft of unsaved work, and autosave
  // 2 seconds after edits stop.
  useEffect(() => {
    if (!loadedRef.current || isLoading) return;
    const snapshot = JSON.stringify(currentSnapshot());
    if (snapshot === snapshotRef.current) {
      setIsDirty(false);
      return;
    }
    setIsDirty(true);
    writeDraft(draftKey, currentSnapshot());
    setSaveNote("Unsaved changes");
    const timer = setTimeout(() => {
      void performSave(true);
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, excerpt, status, tags, isLoading]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function restorePendingDraft() {
    if (!pendingDraft) return;
    setTitle(pendingDraft.title);
    const shape = parseContent(pendingDraft.content);
    setBlocks(shape.blocks);
    setTemplateId(shape.templateId);
    setContent(pendingDraft.content);
    setExcerpt(pendingDraft.excerpt);
    setStatus(pendingDraft.status);
    setTags(pendingDraft.tags);
    setPendingDraft(null);
    // The change effect marks it dirty, rewrites the draft, and autosaves.
  }

  function discardPendingDraft() {
    clearDraft(draftKey);
    setPendingDraft(null);
  }

  if (isLoading) {
    return <div className="h-64 bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Edit Post</h2>
        <div className="flex gap-3 items-center">
          {saveNote && (
            <span className="text-sm text-gray-500 hidden sm:inline">{saveNote}</span>
          )}
          <Button variant="ghost" onClick={() => router.back()}>
            Back
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save
          </Button>
        </div>
      </div>

      {pendingDraft && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="font-medium text-amber-900">
            You have unsaved work on this post from an earlier session
          </p>
          <p className="text-sm text-amber-800 mt-1">
            It was typed but never saved to the server. Restore it to pick up
            where you left off.
          </p>
          <div className="flex gap-3 mt-3">
            <Button size="sm" onClick={restorePendingDraft}>
              Restore unsaved work
            </Button>
            <Button size="sm" variant="ghost" onClick={discardPendingDraft}>
              Discard
            </Button>
          </div>
        </div>
      )}

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
          onSaveAsTemplate={onSaveAsTemplate}
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
