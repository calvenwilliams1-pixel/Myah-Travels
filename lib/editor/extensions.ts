// Single source of truth for the TipTap extension set.
//
// Every consumer — the editor and every renderer — MUST import this
// list. The editor can produce any node/mark these extensions define;
// every renderer MUST be able to render every one of them, or
// generateHTML throws and the raw JSON leaks into the DOM.
//
// Adding an extension here is the only step required to add it to both
// the editor and every renderer. Do not maintain parallel lists.

import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Divider from "@/lib/editor/divider-extension";
import CharacterCount from "@tiptap/extension-character-count";
import FontSize from "@/lib/editor/font-size-extension";
import { YouTubeEmbedNode } from "@/lib/editor/youtube-node";

interface BuildOptions {
  /** Placeholder text — editor-only. Renderers pass undefined. */
  placeholder?: string;
  /**
   * Include editor-only extensions (Placeholder, CharacterCount).
   * Renderers should pass false to keep the schema minimal.
   */
  forEditor?: boolean;
}

/**
 * Build the TipTap extension array. The editor calls with
 * forEditor: true + placeholder; renderers call with defaults.
 */
export function buildExtensions(opts: BuildOptions = {}) {
  const {
    placeholder,
    forEditor = false,
  } = opts;

  const extensions: any[] = [
    StarterKit.configure({
      horizontalRule: false, // replaced by Divider extension below
    }),
    Image.configure({
      HTMLAttributes: {
        class: "rounded-lg max-w-full h-auto",
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline",
      },
    }),
    Underline,
    TextStyle,
    FontSize,
    FontFamily,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Divider,
    YouTubeEmbedNode,
  ];

  if (forEditor) {
    if (placeholder) {
      extensions.push(Placeholder.configure({ placeholder }));
    }
    extensions.push(CharacterCount);
  }

  return extensions;
}

/**
 * DOMPurify config shared by every renderer. Allows the iframe-based
 * YouTube embed, inline style attributes produced by TextStyle and
 * friends, and the standard embed attributes. `sandbox` is explicit
 * even though youtube-node.ts sets it — defence in depth if that
 * file's output ever changes.
 */
export const PURIFY_CONFIG = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: [
    "allow",
    "allowfullscreen",
    "frameborder",
    "sandbox",
    "src",
    "width",
    "height",
    "style",
    "data-youtube-id",
  ],
};
