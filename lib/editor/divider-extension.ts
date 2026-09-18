import HorizontalRule from "@tiptap/extension-horizontal-rule";

// Extended HorizontalRule that carries a thickness (px) and colour.
// Colour defaults to the theme's border colour; Myah can override it
// from a small curated list in the divider config popover.

export interface DividerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    divider: {
      setDivider: (attrs?: { thickness?: number; colour?: string }) => ReturnType;
      updateDivider: (attrs: { thickness?: number; colour?: string }) => ReturnType;
    };
  }
}

export const Divider = HorizontalRule.extend({
  name: "horizontalRule",

  addAttributes() {
    return {
      ...this.parent?.(),
      thickness: {
        default: 2,
        parseHTML: (el) => {
          const value = el.style.borderTopWidth || el.style.borderBottomWidth;
          const n = parseInt(value || "2", 10);
          return Number.isFinite(n) ? n : 2;
        },
        renderHTML: (attrs) => {
          const t = typeof attrs.thickness === "number" ? attrs.thickness : 2;
          return { style: "border-top-width: " + t + "px" };
        },
      },
      colour: {
        default: null,
        parseHTML: (el) => el.style.borderTopColor || null,
        renderHTML: (attrs) => {
          if (!attrs.colour) return {};
          return { style: "border-top-color: " + attrs.colour };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setDivider:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              thickness: attrs?.thickness ?? 2,
              colour: attrs?.colour ?? null,
            },
          });
        },
      updateDivider:
        (attrs) =>
        ({ commands }) => {
          return commands.updateAttributes("horizontalRule", attrs);
        },
    };
  },
});

export default Divider;
