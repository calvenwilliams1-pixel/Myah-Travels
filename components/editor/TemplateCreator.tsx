"use client";

import React, { useState, useEffect } from "react";
import { BlockType, Template, TemplateSection } from "@/types/blocks";
import { getAllBlockDefinitions } from "@/lib/blocks/registry";
import { getAllTemplates } from "@/lib/blocks/templates";

interface TemplateCreatorProps {
  initialTemplates: Template[];
  onSave: (template: Template) => Promise<void>;
  onDelete?: (templateId: string) => Promise<void>;
}

const BLOCK_TYPES: BlockType[] = [
  "title",
  "body",
  "hero",
  "image",
  "gallery",
  "quickFacts",
  "quote",
  "prosCons",
  "verdict",
  "callout",
];

export default function TemplateCreator({
  initialTemplates,
  onSave,
  onDelete,
}: TemplateCreatorProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [themeVariant, setThemeVariant] = useState<"minimal" | "travel" | "review">("minimal");
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const blockDefinitions = getAllBlockDefinitions();

  useEffect(() => {
    if (selectedId) {
      const template = templates.find((t) => t.id === selectedId);
      if (template) {
        setName(template.name);
        setDescription(template.description);
        setThemeVariant(template.themeVariant || "minimal");
        setSections(template.sections);
      }
    }
  }, [selectedId, templates]);

  const handleNewTemplate = () => {
    setSelectedId(null);
    setName("");
    setDescription("");
    setThemeVariant("minimal");
    setSections([]);
  };

  const handleBlockStateChange = (blockType: BlockType, newState: "required" | "optional" | "disabled") => {
    setSections((prev) => {
      const existing = prev.find((s) => s.type === blockType);
      if (existing) {
        return prev.map((s) =>
          s.type === blockType ? { ...s, state: newState } : s
        );
      }
      if (newState !== "disabled") {
        const def = blockDefinitions.find((b) => b.type === blockType);
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: blockType,
            label: def?.label || blockType,
            state: newState,
            maxCount: 1,
          },
        ];
      }
      return prev;
    });
  };

  const handleMaxCountChange = (blockType: BlockType, maxCount: number) => {
    setSections((prev) =>
      prev.map((s) => (s.type === blockType ? { ...s, maxCount } : s))
    );
  };

  const handleLabelChange = (blockType: BlockType, label: string) => {
    setSections((prev) =>
      prev.map((s) => (s.type === blockType ? { ...s, label } : s))
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;

    setIsSaving(true);
    setSaveStatus("Saving...");

    const newTemplate: Template = {
      id: selectedId || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      description,
      themeVariant,
      sections: sections.filter((s) => s.state !== "disabled"),
    };

    try {
      await onSave(newTemplate);
      setSaveStatus("Saved");
      setTemplates((prev) => {
        const existing = prev.findIndex((t) => t.id === newTemplate.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newTemplate;
          return updated;
        }
        return [...prev, newTemplate];
      });
      setSelectedId(newTemplate.id);
    } catch (error) {
      setSaveStatus("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId || !onDelete) return;
    const confirmed = confirm("Delete this template?");
    if (!confirmed) return;

    await onDelete(selectedId);
    setTemplates((prev) => prev.filter((t) => t.id !== selectedId));
    handleNewTemplate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Templates</h2>
          <div className="space-y-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${
                  selectedId === t.id
                    ? "bg-emerald-50 border border-emerald-300"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <span className="font-medium">{t.name}</span>
                <span className="block text-xs text-gray-500">{t.description}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleNewTemplate}
            className="w-full mt-3 px-3 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
          >
            + New Template
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">
            {selectedId ? "Edit Template" : "Create Template"}
          </h2>
          <button
            onClick={handleNewTemplate}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            + New Template
          </button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                placeholder="e.g., Travel Guide"
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
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm min-h-[60px]"
              placeholder="Describe this template..."
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold text-sm">Allowed Blocks</h2>

          {BLOCK_TYPES.map((blockType) => {
            const def = blockDefinitions.find((b) => b.type === blockType);
            if (!def) return null;

            const section = sections.find((s) => s.type === blockType);
            const currentState = section?.state || "disabled";

            return (
              <div key={blockType} className="border border-gray-100 rounded p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{def.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{def.label}</p>
                    <p className="text-xs text-gray-500">{def.description}</p>
                  </div>
                  <select
                    value={currentState}
                    onChange={(e) =>
                      handleBlockStateChange(
                        blockType,
                        e.target.value as "required" | "optional" | "disabled"
                      )
                    }
                    className="text-xs px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="disabled">Disabled</option>
                    <option value="optional">Optional</option>
                    <option value="required">Required</option>
                  </select>
                </div>

                {currentState !== "disabled" && (
                  <div className="mt-2 pl-8 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Label</label>
                      <input
                        type="text"
                        value={section?.label || def.label}
                        onChange={(e) => handleLabelChange(blockType, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Max</label>
                      <input
                        type="number"
                        min={1}
                        max={99}
                        value={section?.maxCount || 1}
                        onChange={(e) =>
                          handleMaxCountChange(blockType, parseInt(e.target.value) || 1)
                        }
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Template"}
          </button>
          {selectedId && onDelete && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Delete
            </button>
          )}
          {saveStatus && <span className="text-xs text-gray-500">{saveStatus}</span>}
        </div>
      </div>
    </div>
  );
}
