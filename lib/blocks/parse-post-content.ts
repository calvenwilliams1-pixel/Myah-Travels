import type { BlockData, Template } from "@/types/blocks";
import { getEditorTemplates } from "./template-store";

interface ParsedPostContent {
  blocks: BlockData[];
  template: Template;
}

/**
 * Parse a post/guide/review content column into blocks + template.
 *
 * Content shape: `{"blocks": [...], "templateId"?: "story"}`
 * Falls back to `story` starter if templateId is missing or unknown.
 *
 * Returns null if content cannot be parsed (legacy malformed data, HTML
 * string, etc.) — caller should render nothing rather than risk garbage.
 */
export async function parsePostContent(raw: string): Promise<ParsedPostContent | null> {
  if (!raw) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!parsed || !Array.isArray(parsed.blocks)) {
    return null;
  }

  const templates = await getEditorTemplates();
  if (!templates || templates.length === 0) {
    return null;
  }

  const templateId = parsed.templateId ?? "story";
  const template =
    templates.find((t) => t.id === templateId) ??
    templates.find((t) => t.id === "story") ??
    templates[0];

  return { blocks: parsed.blocks as BlockData[], template };
}
