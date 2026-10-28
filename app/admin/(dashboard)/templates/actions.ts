"use server";

import { randomUUID } from "node:crypto";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/logging";
import {
  saveTemplateToDb,
  deleteTemplateFromDb,
  getTemplateSlugContentType,
  countPostsUsingTemplate,
} from "@/lib/blocks/template-store";
import { STARTER_TEMPLATES } from "@/lib/blocks/templates";
import type { Template, TemplateSection, BlockType } from "@/types/blocks";

const VALID_THEMES = ["minimal", "travel", "review"] as const;
const VALID_BLOCK_TYPES: BlockType[] = [
  "title", "body", "hero", "image", "gallery",
  "quickFacts", "quote", "prosCons", "verdict", "callout",
];
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled-" + Date.now().toString(36);
}

function sanitizeTemplate(
  raw: Template
): { ok: true; template: Template } | { ok: false; error: string } {
  if (!raw || typeof raw.name !== "string" || !raw.name.trim()) {
    return { ok: false, error: "Name is required" };
  }
  if (raw.name.length > 100) {
    return { ok: false, error: "Name must be 100 characters or fewer" };
  }
  const description = typeof raw.description === "string" ? raw.description : "";
  if (description.length > 500) {
    return { ok: false, error: "Description must be 500 characters or fewer" };
  }
  const theme = raw.themeVariant ?? "minimal";
  if (!VALID_THEMES.includes(theme)) {
    return { ok: false, error: "Invalid theme" };
  }
  if (!Array.isArray(raw.sections) || raw.sections.length > VALID_BLOCK_TYPES.length) {
    return { ok: false, error: "Invalid sections" };
  }

  const seen = new Set<BlockType>();
  const sections: TemplateSection[] = [];
  for (const s of raw.sections) {
    if (!s || !VALID_BLOCK_TYPES.includes(s.type)) {
      return { ok: false, error: "Invalid block type" };
    }
    if (seen.has(s.type)) {
      return { ok: false, error: `Duplicate block: ${s.type}` };
    }
    seen.add(s.type);
    if (s.state === "disabled") continue;
    if (s.state !== "required" && s.state !== "optional") {
      return { ok: false, error: `Invalid state for ${s.type}` };
    }
    if (!Number.isInteger(s.maxCount) || s.maxCount < 1 || s.maxCount > 99) {
      return { ok: false, error: `Max for ${s.type} must be a whole number 1-99` };
    }
    sections.push({
      id: typeof s.id === "string" && s.id ? s.id.slice(0, 64) : randomUUID(),
      type: s.type,
      label: typeof s.label === "string" ? s.label.trim().slice(0, 100) : "",
      state: s.state,
      maxCount: s.maxCount,
    });
  }

  return {
    ok: true,
    template: {
      id: raw.id,
      name: raw.name.trim(),
      description,
      themeVariant: theme,
      sections,
    },
  };
}

export async function saveTemplateAction(
  template: Template,
  mode: "create" | "update"
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const user = await requireAuth();

  const clean = sanitizeTemplate(template);
  if (!clean.ok) return clean;
  const t = clean.template;

  const slug = mode === "create" ? slugify(t.name) : t.id;
  if (typeof slug !== "string" || !SLUG_REGEX.test(slug)) {
    return { ok: false, error: "Invalid template id" };
  }

  const isStarter = STARTER_TEMPLATES.some((s) => s.id === slug);
  const rowType = await getTemplateSlugContentType(slug);

  if (mode === "create" && (isStarter || rowType !== null)) {
    return { ok: false, error: `A template named "${t.name}" already exists` };
  }
  if (mode === "update" && rowType !== "post" && !(rowType === null && isStarter)) {
    return { ok: false, error: "Template not found" };
  }

  try {
    await saveTemplateToDb({ ...t, id: slug });
    await logActivity({
      userId: Number(user.id),
      actionType: mode === "create" ? "create" : "update",
      entityType: "template",
      entityId: null,
      details: `${mode === "create" ? "Created" : "Updated"} template "${t.name}" (${slug})`,
    });
    return { ok: true, id: slug };
  } catch (err) {
    console.error("saveTemplateAction failed:", err);
    return { ok: false, error: "Save failed" };
  }
}

export async function deleteTemplateAction(
  templateId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireAuth();

  if (typeof templateId !== "string" || !SLUG_REGEX.test(templateId)) {
    return { ok: false, error: "Invalid template id" };
  }

  const isStarter = STARTER_TEMPLATES.some((s) => s.id === templateId);

  // Custom templates in use by posts cannot be deleted (guard).
  // Starter resets are always allowed — deleting the override row
  // simply reverts the template to its built-in definition.
  if (!isStarter) {
    try {
      const usage = await countPostsUsingTemplate(templateId);
      if (usage > 0) {
        return {
          ok: false,
          error: `This template is used by ${usage} post${usage === 1 ? "" : "s"}. Reassign or delete those posts first.`,
        };
      }
    } catch (err) {
      console.error("deleteTemplateAction count failed:", err);
      // If counting fails, err on the side of caution
      return { ok: false, error: "Could not verify template usage" };
    }
  }

  try {
    await deleteTemplateFromDb(templateId);
    await logActivity({
      userId: Number(user.id),
      actionType: "delete",
      entityType: "template",
      entityId: null,
      details: `Deleted template "${templateId}"${isStarter ? " (starter override reset)" : ""}`,
    });
    return { ok: true };
  } catch (err) {
    console.error("deleteTemplateAction failed:", err);
    return { ok: false, error: "Delete failed" };
  }
}
