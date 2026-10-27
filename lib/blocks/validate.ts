import type { BlockData, BlockType, Template, TemplateSection } from "@/types/blocks";

/**
 * Is this block "empty" for required-block validation purposes?
 *
 * Different block types have different emptiness criteria:
 * - Text-based: any non-whitespace content counts as filled
 * - Image-based: imageUrl must be present
 * - Array-based: at least one non-empty item
 * - Structural (title, hero, body): the primary field must be present
 */
export function isBlockEmpty(block: BlockData): boolean {
  switch (block.type) {
    case "title":
      return !block.data.text?.trim();

    case "body": {
      const raw = block.data.tiptapJson;
      if (!raw || !raw.trim()) return true;
      // Empty doc shape: {"type":"doc","content":[{"type":"paragraph"}]}
      // No content, or content is a single empty paragraph
      try {
        const parsed = JSON.parse(raw);
        // Envelope format
        const doc = parsed.content ?? parsed;
        if (!doc?.content || doc.content.length === 0) return true;
        // Single paragraph with no text
        if (doc.content.length === 1 && doc.content[0]?.type === "paragraph") {
          const inner = doc.content[0].content;
          if (!inner || inner.length === 0) return true;
          const text = inner.map((n: any) => n.text ?? "").join("").trim();
          return text.length === 0;
        }
        return false;
      } catch {
        // Unparseable — treat as empty for safety
        return true;
      }
    }

    case "hero":
    case "image":
      return !block.data.imageUrl?.trim();

    case "gallery":
      return !block.data.images?.some((img) => img.url?.trim());

    case "quickFacts":
      return !block.data.facts?.some(
        (f) => f.label?.trim() || f.value?.trim()
      );

    case "quote":
      return !block.data.text?.trim();

    case "prosCons":
      return (
        !block.data.pros?.some((p) => p?.trim()) &&
        !block.data.cons?.some((c) => c?.trim())
      );

    case "verdict":
      return !block.data.text?.trim();

    case "callout":
      return !block.data.text?.trim();

    default:
      return false;
  }
}

/**
 * Returns an array of missing required block labels.
 * Empty array = all required blocks present and non-empty.
 *
 * "Present" = at least one block of that type exists AND is non-empty.
 * Template section's state must be "required" for the block to be checked.
 */
export function validateRequiredBlocks(
  blocks: BlockData[],
  template: Template | null
): string[] {
  if (!template) return [];

  const missing: string[] = [];

  for (const section of template.sections ?? []) {
    if (section.state !== "required") continue;

    const blocksOfType = blocks.filter((b) => b.type === section.type);
    const hasNonEmpty = blocksOfType.some((b) => !isBlockEmpty(b));

    if (!hasNonEmpty) {
      missing.push(section.label);
    }
  }

  return missing;
}
