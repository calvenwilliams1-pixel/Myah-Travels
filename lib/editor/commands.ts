import type { Editor } from "@tiptap/react";

// ============================================================
// SHARED EDITOR COMMANDS (Phase 7.9)
// Every formatting action the toolbar and right-click menu can
// invoke. Defined once; both consumers call these. Add a command
// here and both surfaces get it.
// ============================================================

export interface EditorCommand {
  id: string;
  label: string;
  /** Keyboard shortcut label, e.g. "⌘B" */
  shortcut?: string;
  /** Runs the command. Caller already has editor in scope. */
  run: (editor: Editor) => void;
  /** Whether the command is currently active (for toggle highlighting) */
  isActive?: (editor: Editor) => boolean;
  /** Whether the command is currently available */
  isEnabled?: (editor: Editor) => boolean;
}

// ─────────────────────────────────────────────────────────────
// Text style
// ─────────────────────────────────────────────────────────────

export const cmdBold: EditorCommand = {
  id: "bold",
  label: "Bold",
  shortcut: "⌘B",
  run: (e) => e.chain().focus().toggleBold().run(),
  isActive: (e) => e.isActive("bold"),
};

export const cmdItalic: EditorCommand = {
  id: "italic",
  label: "Italic",
  shortcut: "⌘I",
  run: (e) => e.chain().focus().toggleItalic().run(),
  isActive: (e) => e.isActive("italic"),
};

export const cmdUnderline: EditorCommand = {
  id: "underline",
  label: "Underline",
  shortcut: "⌘U",
  run: (e) => e.chain().focus().toggleUnderline().run(),
  isActive: (e) => e.isActive("underline"),
};

export const cmdStrike: EditorCommand = {
  id: "strike",
  label: "Strikethrough",
  shortcut: "⌘⇧X",
  run: (e) => e.chain().focus().toggleStrike().run(),
  isActive: (e) => e.isActive("strike"),
};

// ─────────────────────────────────────────────────────────────
// Headings
// ─────────────────────────────────────────────────────────────

export const cmdH1: EditorCommand = {
  id: "h1",
  label: "Heading 1",
  run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  isActive: (e) => e.isActive("heading", { level: 1 }),
};

export const cmdH2: EditorCommand = {
  id: "h2",
  label: "Heading 2",
  run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  isActive: (e) => e.isActive("heading", { level: 2 }),
};

export const cmdH3: EditorCommand = {
  id: "h3",
  label: "Heading 3",
  run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  isActive: (e) => e.isActive("heading", { level: 3 }),
};

export const cmdParagraph: EditorCommand = {
  id: "paragraph",
  label: "Body text",
  run: (e) => e.chain().focus().setParagraph().run(),
  isActive: (e) => e.isActive("paragraph"),
};

// ─────────────────────────────────────────────────────────────
// Alignment
// ─────────────────────────────────────────────────────────────

export const cmdAlignLeft: EditorCommand = {
  id: "align-left",
  label: "Align left",
  run: (e) => e.chain().focus().setTextAlign("left").run(),
  isActive: (e) => e.isActive({ textAlign: "left" }),
};

export const cmdAlignCenter: EditorCommand = {
  id: "align-center",
  label: "Align centre",
  run: (e) => e.chain().focus().setTextAlign("center").run(),
  isActive: (e) => e.isActive({ textAlign: "center" }),
};

export const cmdAlignRight: EditorCommand = {
  id: "align-right",
  label: "Align right",
  run: (e) => e.chain().focus().setTextAlign("right").run(),
  isActive: (e) => e.isActive({ textAlign: "right" }),
};

export const cmdAlignJustify: EditorCommand = {
  id: "align-justify",
  label: "Justify",
  run: (e) => e.chain().focus().setTextAlign("justify").run(),
  isActive: (e) => e.isActive({ textAlign: "justify" }),
};

// ─────────────────────────────────────────────────────────────
// Lists
// ─────────────────────────────────────────────────────────────

export const cmdBulletList: EditorCommand = {
  id: "bullet-list",
  label: "Bulleted list",
  run: (e) => e.chain().focus().toggleBulletList().run(),
  isActive: (e) => e.isActive("bulletList"),
};

export const cmdOrderedList: EditorCommand = {
  id: "ordered-list",
  label: "Numbered list",
  run: (e) => e.chain().focus().toggleOrderedList().run(),
  isActive: (e) => e.isActive("orderedList"),
};

// ─────────────────────────────────────────────────────────────
// Structure
// ─────────────────────────────────────────────────────────────

export const cmdBlockquote: EditorCommand = {
  id: "blockquote",
  label: "Blockquote",
  run: (e) => e.chain().focus().toggleBlockquote().run(),
  isActive: (e) => e.isActive("blockquote"),
};

export const cmdHorizontalRule: EditorCommand = {
  id: "hr",
  label: "Divider",
  run: (e) => e.chain().focus().setHorizontalRule().run(),
};

// ─────────────────────────────────────────────────────────────
// Insert
// ─────────────────────────────────────────────────────────────

export const cmdLink: EditorCommand = {
  id: "link",
  label: "Link",
  shortcut: "⌘K",
  run: (e) => {
    const previous = e.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous || "https://");
    if (url === null) return;
    if (url.trim() === "") {
      // Only unset if a link mark already exists.
      if (e.isActive("link")) {
        e.chain().focus().extendMarkRange("link").unsetLink().run();
      }
      return;
    }
    // If selection already has a link, replace its range. Otherwise
    // just apply the link mark to the current selection.
    if (e.isActive("link")) {
      e.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      e.chain().focus().setLink({ href: url }).run();
    }
  },
  isActive: (e) => e.isActive("link"),
};

// ─────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────

export const cmdUndo: EditorCommand = {
  id: "undo",
  label: "Undo",
  shortcut: "⌘Z",
  run: (e) => e.chain().focus().undo().run(),
  isEnabled: (e) => e.can().undo(),
};

export const cmdRedo: EditorCommand = {
  id: "redo",
  label: "Redo",
  shortcut: "⌘⇧Z",
  run: (e) => e.chain().focus().redo().run(),
  isEnabled: (e) => e.can().redo(),
};

export const cmdClearFormatting: EditorCommand = {
  id: "clear-formatting",
  label: "Clear formatting",
  run: (e) => e.chain().focus().unsetAllMarks().clearNodes().run(),
};

// ─────────────────────────────────────────────────────────────
// Groups — used by both the toolbar and the context menu
// ─────────────────────────────────────────────────────────────

export const COMMAND_GROUPS: { label: string; commands: EditorCommand[] }[] = [
  {
    label: "Text",
    commands: [cmdBold, cmdItalic, cmdUnderline, cmdStrike],
  },
  {
    label: "Blocks",
    commands: [cmdH1, cmdH2, cmdH3, cmdParagraph, cmdBlockquote],
  },
  {
    label: "Align",
    commands: [cmdAlignLeft, cmdAlignCenter, cmdAlignRight, cmdAlignJustify],
  },
  {
    label: "Lists",
    commands: [cmdBulletList, cmdOrderedList],
  },
  {
    label: "Insert",
    commands: [cmdLink, cmdHorizontalRule],
  },
  {
    label: "Utility",
    commands: [cmdUndo, cmdRedo, cmdClearFormatting],
  },
];

// Context-menu-specific subset — the most useful actions for right-click
export const CONTEXT_MENU_COMMANDS: EditorCommand[] = [
  cmdBold,
  cmdItalic,
  cmdUnderline,
  cmdLink,
  cmdBulletList,
  cmdOrderedList,
  cmdBlockquote,
  cmdClearFormatting,
];
