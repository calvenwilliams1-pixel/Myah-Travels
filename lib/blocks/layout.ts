import type { BlockType, Template, TemplateSection } from "@/types/blocks";

/**
 * Saved-layout support for block templates (type overhaul, Nov 23,
 * 2026). A template saved from a real post carries `layout`: the
 * ordered block types of that post, duplicates included — the exact
 * arrangement the writer set up. `sections` (the rules layer) is
 * derived from it so both views of the template stay consistent.
 */

export const LAYOUT_BLOCK_TYPES: BlockType[] = [
  "title", "body", "hero", "image", "gallery",
  "quickFacts", "quote", "prosCons", "verdict", "callout",
];

export const MAX_LAYOUT_BLOCKS = 60;

/**
 * A template with a layout is an arrangement, not a rulebook (Cal,
 * 2026-11-24): it says what a new post starts with, in what order,
 * and after that the writer can add or remove any block. Templates
 * without a layout (the built-in starters) keep the older rules
 * behaviour in the post editor until they are saved from the builder.
 */
export function isLayoutTemplate(
  template: Pick<Template, "layout"> | null | undefined
): boolean {
  return Array.isArray(template?.layout) && template.layout.length > 0;
}

export function isValidLayout(value: unknown): value is BlockType[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_LAYOUT_BLOCKS &&
    value.every((v) => typeof v === "string" && (LAYOUT_BLOCK_TYPES as string[]).includes(v))
  );
}

/**
 * Derive the rules layer from a saved layout: one required section
 * per block type, in first-appearance order, capped at how many of
 * that type the layout itself uses.
 */
export function sectionsFromLayout(layout: BlockType[]): TemplateSection[] {
  const order: BlockType[] = [];
  const counts = new Map<BlockType, number>();
  for (const type of layout) {
    if (!counts.has(type)) order.push(type);
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return order.map((type) => ({
    id: `layout-${type}`,
    type,
    label: "",
    state: "required" as const,
    maxCount: counts.get(type)!,
  }));
}
