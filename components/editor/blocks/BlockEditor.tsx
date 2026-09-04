"use client";

import React, { useState, useEffect } from "react";
import { BlockData, BlockType } from "@/types/blocks";
import { getBlockDefinition, getAllBlockDefinitions } from "@/lib/blocks/registry";
import { getTemplateById, getAllTemplates } from "@/lib/blocks/templates";
import TitleBlockEditor from "./TitleBlockEditor";
import BodyBlockEditor from "./BodyBlockEditor";
import CalloutBlockEditor from "./CalloutBlockEditor";
import HeroBlockEditor from "./HeroBlockEditor";
import ImageBlockEditor from "./ImageBlockEditor";
import GalleryBlockEditor from "./GalleryBlockEditor";
import QuickFactsBlockEditor from "./QuickFactsBlockEditor";
import QuoteBlockEditor from "./QuoteBlockEditor";
import ProsConsBlockEditor from "./ProsConsBlockEditor";
import VerdictBlockEditor from "./VerdictBlockEditor";
import TemplatePreview from "./TemplatePreview";

const IMPLEMENTED_BLOCKS: BlockType[] = [
  "title",
  "body",
  "callout",
  "hero",
  "image",
  "gallery",
  "quickFacts",
  "quote",
  "prosCons",
  "verdict",
];

interface BlockEditorProps {
  initialBlocks?: BlockData[];
  initialTemplateId?: string;
  onChange?: (blocks: BlockData[], templateId: string) => void;
}

export default function BlockEditor({
  initialBlocks = [],
  initialTemplateId = "story",
  onChange,
}: BlockEditorProps) {
  const [blocks, setBlocks] = useState<BlockData[]>(initialBlocks);
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [isInitialised, setIsInitialised] = useState(false);

  const loadTemplate = (newTemplateId: string) => {
    const template = getTemplateById(newTemplateId);
    if (!template) return;

    const newBlocks: BlockData[] = [];

    template.sections.forEach((section) => {
      if (section.state === "required") {
        const def = getBlockDefinition(section.type);
        newBlocks.push(def.getDefaultData());
      }
    });

    setBlocks(newBlocks);
    setTemplateId(newTemplateId);
    onChange?.(newBlocks, newTemplateId);
  };

  // Auto-load required blocks on first render
  useEffect(() => {
    if (!isInitialised && blocks.length === 0) {
      loadTemplate(initialTemplateId);
      setIsInitialised(true);
    }
  }, [isInitialised, blocks.length, initialTemplateId]);

  const handleTemplateChange = (newTemplateId: string) => {
    if (blocks.length > 0) {
      const confirmed = confirm("Switching templates will reset your content. Continue?");
      if (!confirmed) return;
    }
    loadTemplate(newTemplateId);
  };

  const canDeleteBlock = (blockId: string): boolean => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return false;

    const template = getTemplateById(templateId);
    if (!template) return true;

    const section = template.sections.find((s) => s.type === block.type);
    return section?.state !== "required";
  };

  const canAddBlock = (type: BlockType): boolean => {
    const template = getTemplateById(templateId);
    if (!template) return true;

    const section = template.sections.find((s) => s.type === type);
    if (!section) return false;

    const currentCount = blocks.filter((b) => b.type === type).length;
    return currentCount < section.maxCount;
  };

  const handleAddBlock = (type: BlockType) => {
    if (!canAddBlock(type)) return;

    const def = getBlockDefinition(type);
    const newBlock = def.getDefaultData();
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    onChange?.(updated, templateId);
  };

  const handleRemoveBlock = (id: string) => {
    if (!canDeleteBlock(id)) return;

    const updated = blocks.filter((b) => b.id !== id);
    setBlocks(updated);
    onChange?.(updated, templateId);
  };

  const handleMoveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex((b) => b.id === id);
    if (index === -1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;

    const updated = [...blocks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setBlocks(updated);
    onChange?.(updated, templateId);
  };

  const handleUpdateBlock = (id: string, data: any) => {
    const updated = blocks.map((b) =>
      b.id === id ? { ...b, data: { ...b.data, ...data } } : b
    );
    setBlocks(updated);
    onChange?.(updated, templateId);
  };

  const renderBlockEditor = (block: BlockData) => {
    switch (block.type) {
      case "title":
        return (
          <TitleBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "body":
        return (
          <BodyBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "callout":
        return (
          <CalloutBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "hero":
        return (
          <HeroBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "image":
        return (
          <ImageBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "gallery":
        return (
          <GalleryBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "quickFacts":
        return (
          <QuickFactsBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "quote":
        return (
          <QuoteBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "prosCons":
        return (
          <ProsConsBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      case "verdict":
        return (
          <VerdictBlockEditor
            data={block.data as any}
            onChange={(data) => handleUpdateBlock(block.id, data)}
          />
        );
      default:
        return null;
    }
  };

  const allowedBlocks = getAllBlockDefinitions().filter(
    (block) => IMPLEMENTED_BLOCKS.includes(block.type)
  );

  const [showAddMenu, setShowAddMenu] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <label className="text-sm font-medium">Template:</label>
        <select
          value={templateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        >
          {getAllTemplates().map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">
                {getBlockDefinition(block.type).icon} {getBlockDefinition(block.type).label}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMoveBlock(block.id, "up")}
                  disabled={index === 0}
                  className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveBlock(block.id, "down")}
                  disabled={index === blocks.length - 1}
                  className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  ↓
                </button>
                {canDeleteBlock(block.id) ? (
                  <button
                    onClick={() => handleRemoveBlock(block.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="text-xs text-gray-300" title="Required block">🔒</span>
                )}
              </div>
            </div>
            {renderBlockEditor(block)}
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No content yet. Add a block below.
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-emerald-500 hover:text-emerald-700"
        >
          + Add Block
        </button>

        {showAddMenu && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            {allowedBlocks.map((block) => {
              const canAdd = canAddBlock(block.type);
              return (
                <button
                  key={block.type}
                  onClick={() => {
                    if (canAdd) {
                      handleAddBlock(block.type);
                      setShowAddMenu(false);
                    }
                  }}
                  disabled={!canAdd}
                  className={`w-full text-left px-3 py-2 text-sm rounded flex items-center gap-2 ${
                    canAdd ? "hover:bg-emerald-50" : "opacity-40 cursor-not-allowed"
                  }`}
                >
                  <span>{block.icon}</span>
                  <span>{block.label}</span>
                  <span className="text-xs text-gray-400 ml-auto">{block.description}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      </div>

      {/* Preview column */}
      <TemplatePreview
        blocks={blocks}
        template={getTemplateById(templateId)!}
      />
    </div>
  );
}
