"use client";

import React, { useState } from "react";
import { BlockData, BlockType, Template } from "@/types/blocks";
import { getAllBlockDefinitions, getBlockDefinition } from "@/lib/blocks/registry";
import { getAllTemplates } from "@/lib/blocks/templates";
import { sectionsFromLayout } from "@/lib/blocks/layout";
import { getSampleBlockData, summarizeSampleBlock } from "@/lib/blocks/sample-data";
import PostRenderer from "./renderers/PostRenderer";

type SaveResult = { ok: true; id: string } | { ok: false; error: string };
type DeleteResult = { ok: true } | { ok: false; error: string };

interface TemplateManagerProps {
  initialTemplates: Template[];
  /** Posts using each template, by template id. */
  postCounts: Record<string, number>;
  /** Built-in starters the site owner has saved her own version of. */
  resettableIds: string[];
  starterIds: string[];
  onSave: (template: Template, mode: "create" | "update") => Promise<SaveResult>;
  onDelete?: (templateId: string) => Promise<DeleteResult>;
}

const BLOCK_TYPES: BlockType[] = [
  "title",
  "hero",
  "body",
  "image",
  "gallery",
  "quickFacts",
  "quote",
  "prosCons",
  "verdict",
  "callout",
];

/** The arrangement a template opens with, as block types in order. */
function arrangementOf(template: Template): BlockType[] {
  if (template.layout && template.layout.length > 0) return template.layout;
  return (template.sections || []).map((s) => s.type);
}

/**
 * The Template Manager (Cal, 2026-11-24): one place that creates,
 * edits and manages post templates. It replaces the old rules form
 * (allowed blocks, required or optional, maximum counts), which was
 * built for setting limits for staff and made no sense for one
 * person making her own layouts.
 *
 * Here a template is an arrangement. The builder fills every block
 * with sample words and sample photos, and the preview beside it
 * shows the post the way a reader would see it. Saving stores only
 * the ordered block types; a post started from the template starts
 * empty, as posts always have.
 */
export default function TemplateCreator({
  initialTemplates,
  postCounts,
  resettableIds,
  starterIds,
  onSave,
  onDelete,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [counts, setCounts] = useState<Record<string, number>>(postCounts);
  const [status, setStatus] = useState("");

  const [view, setView] = useState<"list" | "build">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeVariant, setThemeVariant] = useState<"minimal" | "travel" | "review">("minimal");
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const blockDefinitions = getAllBlockDefinitions();
  const isStarter = (id: string) => starterIds.includes(id);
  const isResettable = (id: string) => resettableIds.includes(id);

  // ---- Builder ----------------------------------------------------

  function openBuilder(template: Template | null) {
    setSaveStatus("");
    if (template) {
      setEditingId(template.id);
      setName(template.name);
      setDescription(template.description);
      setThemeVariant(template.themeVariant || "minimal");
      setBlocks(arrangementOf(template).map((t) => getSampleBlockData(t)));
    } else {
      setEditingId(null);
      setName("");
      setDescription("");
      setThemeVariant("minimal");
      setBlocks([]);
    }
    setView("build");
  }

  function addBlock(type: BlockType) {
    setBlocks((prev) => [...prev, getSampleBlockData(type)]);
    setSaveStatus("");
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: "up" | "down") {
    setBlocks((prev) => {
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [item] = next.splice(dragIndex, 1);
      next.splice(index, 0, item);
      return next;
    });
    setDragIndex(index);
  }

  function workingTemplate(): Template {
    const layout = blocks.map((b) => b.type);
    return {
      id: editingId ?? "preview",
      name: name.trim() || "Untitled template",
      description,
      themeVariant,
      sections: sectionsFromLayout(layout),
      ...(layout.length > 0 ? { layout } : {}),
    };
  }

  async function handleSave() {
    if (!name.trim() || blocks.length === 0) return;
    setIsSaving(true);
    setSaveStatus("Saving...");
    const template = workingTemplate();
    try {
      const res = await onSave(template, editingId ? "update" : "create");
      if (!res.ok) {
        setSaveStatus(res.error);
        return;
      }
      const saved = { ...template, id: res.id };
      setTemplates((prev) => {
        const at = prev.findIndex((t) => t.id === saved.id);
        if (at >= 0) {
          const next = [...prev];
          next[at] = saved;
          return next;
        }
        return [...prev, saved];
      });
      setCounts((prev) => ({ ...prev, [res.id]: prev[res.id] ?? 0 }));
      setStatus(`Saved "${saved.name}".`);
      setView("list");
    } catch {
      setSaveStatus("Save failed. Try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // ---- List actions -------------------------------------------------

  async function handleDuplicate(template: Template) {
    setStatus("");
    const copy: Template = { ...template, id: "", name: `${template.name} copy` };
    try {
      const res = await onSave(copy, "create");
      if (!res.ok) {
        setStatus(res.error);
        return;
      }
      setTemplates((prev) => [...prev, { ...copy, id: res.id }]);
      setCounts((prev) => ({ ...prev, [res.id]: 0 }));
      setStatus(`Duplicated as "${copy.name}".`);
    } catch {
      setStatus("Duplicate failed. Try again.");
    }
  }

  async function handleDelete(template: Template) {
    if (!onDelete) return;
    const resetting = isStarter(template.id);
    const confirmed = confirm(
      resetting
        ? `Reset "${template.name}" back to the built-in original? Your saved version goes away.`
        : `Delete "${template.name}" for good?`
    );
    if (!confirmed) return;
    try {
      const res = await onDelete(template.id);
      if (!res.ok) {
        setStatus(res.error);
        return;
      }
      if (resetting) {
        const original = getAllTemplates().find((t) => t.id === template.id);
        setTemplates((prev) =>
          original ? prev.map((t) => (t.id === template.id ? original : t)) : prev
        );
        setStatus(`"${template.name}" is back to the built-in original.`);
      } else {
        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
        setStatus(`Deleted "${template.name}".`);
      }
    } catch {
      setStatus("Delete failed. Try again.");
    }
  }

  // ---- Views --------------------------------------------------------

  if (view === "build") {
    const editingStarter = editingId !== null && isStarter(editingId);
    return (
      <div>
        <button
          onClick={() => setView("list")}
          className="text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          ← All templates
        </button>
        <h2 className="text-xl font-semibold mb-1">
          {editingId ? "Edit template" : "New template"}
        </h2>
        {editingStarter && (
          <p className="text-sm text-gray-500 mb-4">
            This is a built-in template. Saving keeps your version here, and you can
            reset it back to the original from the list any time.
          </p>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., Beach Trip"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Theme</label>
              <select
                value={themeVariant}
                onChange={(e) =>
                  setThemeVariant(e.target.value as "minimal" | "travel" | "review")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              >
                <option value="minimal">Minimal</option>
                <option value="travel">Travel</option>
                <option value="review">Review</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm min-h-[52px]"
              placeholder="What is this template for?"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div>
            <h3 className="font-semibold text-sm mb-2">Add a block</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
              {BLOCK_TYPES.map((type) => {
                const def = blockDefinitions.find((b) => b.type === type);
                if (!def) return null;
                return (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="min-h-[44px] text-left border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-primary/60"
                  >
                    <span className="block text-sm font-medium">
                      {def.icon} {def.label}
                    </span>
                    <span className="block text-xs text-gray-500">{def.description}</span>
                  </button>
                );
              })}
            </div>

            <h3 className="font-semibold text-sm mb-2">The arrangement</h3>
            {blocks.length === 0 ? (
              <p className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-4">
                Nothing here yet. Click a block above and it lands in this list, filled
                with sample words so you can see how it looks.
              </p>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, i) => {
                  const def = getBlockDefinition(block.type);
                  const thumb =
                    block.type === "hero" || block.type === "image"
                      ? block.data.imageUrl
                      : block.type === "gallery"
                        ? block.data.images[0]?.url
                        : undefined;
                  return (
                    <div
                      key={block.id}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragEnd={() => setDragIndex(null)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      className={`flex items-center gap-3 border border-gray-200 rounded-lg bg-white px-3 py-2 ${
                        dragIndex === i ? "opacity-40" : ""
                      }`}
                    >
                      <span className="cursor-grab text-gray-400 select-none" aria-hidden>
                        ⠿
                      </span>
                      {thumb && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-10 w-14 rounded object-cover border border-gray-100"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {def.icon} {def.label}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {summarizeSampleBlock(block)}
                        </p>
                      </div>
                      <button
                        onClick={() => moveBlock(i, "up")}
                        disabled={i === 0}
                        aria-label={`Move ${def.label} up`}
                        className="h-9 w-9 rounded border border-gray-200 text-gray-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveBlock(i, "down")}
                        disabled={i === blocks.length - 1}
                        aria-label={`Move ${def.label} down`}
                        className="h-9 w-9 rounded border border-gray-200 text-gray-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeBlock(i)}
                        aria-label={`Remove ${def.label}`}
                        className="h-9 w-9 rounded border border-gray-200 text-gray-600 hover:text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3">
              Drag a block by its handle to reorder it, or use the arrows.
            </p>
          </div>

          <div className="lg:sticky lg:top-4">
            <h3 className="font-semibold text-sm mb-2">Preview</h3>
            <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
              <p className="text-xs text-gray-500 px-4 pt-3">
                Filled with sample words and photos, the way a reader would see the
                post. A real post started from this template starts empty.
              </p>
              <div className="max-h-[640px] overflow-auto">
                {blocks.length === 0 ? (
                  <p className="text-sm text-gray-400 px-4 py-10 text-center">
                    Add a block and the preview appears here.
                  </p>
                ) : (
                  <PostRenderer blocks={blocks} template={workingTemplate()} isPreview={false} />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || blocks.length === 0}
            className="min-h-[44px] px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save template"}
          </button>
          <button
            onClick={() => setView("list")}
            className="min-h-[44px] px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          {!name.trim() && (
            <span className="text-xs text-gray-500">Give it a name first.</span>
          )}
          {name.trim() && blocks.length === 0 && (
            <span className="text-xs text-gray-500">Add at least one block.</span>
          )}
          {saveStatus && <span className="text-xs text-gray-500">{saveStatus}</span>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 max-w-xl">
          A template is the starting shape of a post: the blocks it opens with, in
          order. Build one here, then pick it when you write a post.
        </p>
        <button
          onClick={() => openBuilder(null)}
          className="min-h-[44px] shrink-0 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark"
        >
          + New template
        </button>
      </div>
      {status && <p className="text-sm text-gray-500 mb-3">{status}</p>}

      <div className="space-y-3">
        {templates.map((t) => {
          const usedBy = counts[t.id] ?? 0;
          const starter = isStarter(t.id);
          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">{t.name}</h2>
                <span className="text-xs text-gray-500">
                  {starter ? "Built-in · " : ""}
                  {usedBy === 0
                    ? "Not used by any post yet"
                    : `Used by ${usedBy} post${usedBy === 1 ? "" : "s"}`}
                </span>
              </div>
              {t.description && (
                <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {arrangementOf(t).map((type, i) => {
                  const def = blockDefinitions.find((b) => b.type === type);
                  return (
                    <span
                      key={`${type}-${i}`}
                      className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700"
                    >
                      {def?.icon} {def?.label || type}
                    </span>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => openBuilder(t)}
                  className="min-h-[40px] px-4 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDuplicate(t)}
                  className="min-h-[40px] px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-primary/60"
                >
                  Duplicate
                </button>
                {onDelete && (!starter || isResettable(t.id)) && (
                  <button
                    onClick={() => handleDelete(t)}
                    disabled={!starter && usedBy > 0}
                    title={
                      !starter && usedBy > 0
                        ? `Used by ${usedBy} post${usedBy === 1 ? "" : "s"}. Those posts need a different template first.`
                        : undefined
                    }
                    className="min-h-[40px] px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:text-red-600 disabled:opacity-40 disabled:hover:text-gray-700"
                  >
                    {starter ? "Reset" : "Delete"}
                  </button>
                )}
              </div>
              {!starter && usedBy > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Delete is off while posts use this template. Those posts need a
                  different template first.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
