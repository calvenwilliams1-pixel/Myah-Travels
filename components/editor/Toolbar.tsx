"use client";

import React, { useState } from "react";
import type { Editor } from "@tiptap/react";
import ColorPicker from "./pickers/ColorPicker";
import FontFamilyPicker from "./pickers/FontFamilyPicker";
import FontSizePicker from "./pickers/FontSizePicker";
import DividerConfig from "./pickers/DividerConfig";
import WordCount from "./pickers/WordCount";
import {
  COMMAND_GROUPS,
  cmdBold,
  cmdItalic,
  cmdUnderline,
  cmdStrike,
  cmdH1,
  cmdH2,
  cmdH3,
  cmdBulletList,
  cmdOrderedList,
  cmdLink,
} from "@/lib/editor/commands";

interface ToolbarProps {
  editor: Editor;
  contentType?: string;
}

type OpenPicker = null | "colour-text" | "colour-highlight" | "font" | "size" | "divider";

export default function Toolbar({ editor }: ToolbarProps) {
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [showMore, setShowMore] = useState(false);

  if (!editor) return null;

  const btn = (
    key: string,
    run: () => void,
    opts: {
      active?: boolean;
      disabled?: boolean;
      label: string;
      shortcut?: string;
      children: React.ReactNode;
    }
  ) => {
    // Tile-style button. Gradients are derived from theme CSS vars so
    // the toolbar picks up primary/secondary colours automatically.
    // No hardcoded hues — all built on top of `--color-primary-rgb`.
    const base =
      "w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium " +
      "transition-all duration-150 select-none border border-transparent ";
    const look = opts.active
      ? "bg-primary/15 text-primary border-primary/30 shadow-inner"
      : "text-gray-600 bg-gradient-to-b from-white to-primary/5 hover:to-primary/15 hover:border-primary/20";
    const disabled = opts.disabled ? " opacity-40 cursor-not-allowed" : "";
    return (
      <button
        key={key}
        type="button"
        onClick={run}
        disabled={opts.disabled}
        title={opts.shortcut ? opts.label + " (" + opts.shortcut + ")" : opts.label}
        aria-label={opts.label}
        aria-pressed={opts.active}
        className={base + look + disabled}
      >
        {opts.children}
      </button>
    );
  };

  const divider = <span className="w-px h-6 bg-gray-200 mx-1 opacity-60" />;

  const currentTextColour = editor.getAttributes("textStyle").color as string | undefined;

  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50">
      <div className="px-3 py-2 flex flex-wrap items-center gap-1">
        {/* Text style */}
        {btn("bold", () => cmdBold.run(editor), {
          active: cmdBold.isActive?.(editor),
          label: cmdBold.label,
          shortcut: cmdBold.shortcut,
          children: <span className="font-bold">B</span>,
        })}
        {btn("italic", () => cmdItalic.run(editor), {
          active: cmdItalic.isActive?.(editor),
          label: cmdItalic.label,
          shortcut: cmdItalic.shortcut,
          children: <span className="italic">I</span>,
        })}
        {btn("underline", () => cmdUnderline.run(editor), {
          active: cmdUnderline.isActive?.(editor),
          label: cmdUnderline.label,
          shortcut: cmdUnderline.shortcut,
          children: <span className="underline">U</span>,
        })}
        {btn("strike", () => cmdStrike.run(editor), {
          active: cmdStrike.isActive?.(editor),
          label: cmdStrike.label,
          shortcut: cmdStrike.shortcut,
          children: <span className="line-through">S</span>,
        })}

        {divider}

        {/* Headings */}
        {btn("h1", () => cmdH1.run(editor), {
          active: cmdH1.isActive?.(editor),
          label: cmdH1.label,
          children: <span className="font-semibold text-xs">H1</span>,
        })}
        {btn("h2", () => cmdH2.run(editor), {
          active: cmdH2.isActive?.(editor),
          label: cmdH2.label,
          children: <span className="font-semibold text-xs">H2</span>,
        })}
        {btn("h3", () => cmdH3.run(editor), {
          active: cmdH3.isActive?.(editor),
          label: cmdH3.label,
          children: <span className="font-semibold text-xs">H3</span>,
        })}

        {divider}

        {/* Lists */}
        {btn("bullet", () => cmdBulletList.run(editor), {
          active: cmdBulletList.isActive?.(editor),
          label: cmdBulletList.label,
          children: <span>•</span>,
        })}
        {btn("ordered", () => cmdOrderedList.run(editor), {
          active: cmdOrderedList.isActive?.(editor),
          label: cmdOrderedList.label,
          children: <span className="text-xs">1.</span>,
        })}

        {divider}

        {/* Font family */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPicker(openPicker === "font" ? null : "font")}
            className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100"
            title="Font family"
            aria-label="Font family"
            aria-haspopup="true"
            aria-expanded={openPicker === "font"}
          >
            Aa
          </button>
          {openPicker === "font" && <FontFamilyPicker editor={editor} onClose={() => setOpenPicker(null)} />}
        </div>

        {/* Font size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPicker(openPicker === "size" ? null : "size")}
            className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100"
            title="Font size"
            aria-label="Font size"
            aria-haspopup="true"
            aria-expanded={openPicker === "size"}
          >
            Size
          </button>
          {openPicker === "size" && <FontSizePicker editor={editor} onClose={() => setOpenPicker(null)} />}
        </div>

        {divider}

        {/* Text colour */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPicker(openPicker === "colour-text" ? null : "colour-text")}
            className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 flex items-center gap-1"
            title="Text colour"
            aria-label="Text colour"
            aria-haspopup="true"
            aria-expanded={openPicker === "colour-text"}
          >
            <span className="text-xs font-semibold">A</span>
            <span
              className="w-3 h-3 rounded-sm border border-gray-300"
              style={{
                backgroundColor: currentTextColour || "#111827",
              }}
            />
          </button>
          {openPicker === "colour-text" && <ColorPicker editor={editor} kind="text" onClose={() => setOpenPicker(null)} />}
        </div>

        {/* Highlight */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPicker(openPicker === "colour-highlight" ? null : "colour-highlight")}
            className="px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-100"
            title="Highlight"
            aria-label="Highlight"
            aria-haspopup="true"
            aria-expanded={openPicker === "colour-highlight"}
          >
            <span className="px-1 rounded bg-yellow-200">H</span>
          </button>
          {openPicker === "colour-highlight" && <ColorPicker editor={editor} kind="highlight" onClose={() => setOpenPicker(null)} />}
        </div>

        {divider}

        {/* Link */}
        {btn("link", () => cmdLink.run(editor), {
          active: cmdLink.isActive?.(editor),
          label: cmdLink.label,
          shortcut: cmdLink.shortcut,
          children: <span className="text-xs">🔗</span>,
        })}

        <div className="ml-auto flex items-center gap-2">
          <WordCount editor={editor} />
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100"
            title="More tools"
            aria-expanded={showMore}
          >
            {showMore ? "Less ▲" : "More ▼"}
          </button>
        </div>
      </div>

      {showMore && (
        <div className="px-3 pb-2 pt-2 flex flex-wrap items-center gap-1 border-t border-gray-100">
          {/* Alignment */}
          <span className="text-xs text-gray-400 mr-1">Align:</span>
          {btn("align-left", () => editor.chain().focus().setTextAlign("left").run(), {
            active: editor.isActive({ textAlign: "left" }),
            label: "Align left",
            children: <span className="text-xs">⬅</span>,
          })}
          {btn("align-center", () => editor.chain().focus().setTextAlign("center").run(), {
            active: editor.isActive({ textAlign: "center" }),
            label: "Align centre",
            children: <span className="text-xs">⬌</span>,
          })}
          {btn("align-right", () => editor.chain().focus().setTextAlign("right").run(), {
            active: editor.isActive({ textAlign: "right" }),
            label: "Align right",
            children: <span className="text-xs">➡</span>,
          })}
          {btn("align-justify", () => editor.chain().focus().setTextAlign("justify").run(), {
            active: editor.isActive({ textAlign: "justify" }),
            label: "Justify",
            children: <span className="text-xs">⬍</span>,
          })}

          {divider}

          {/* Insert */}
          <span className="text-xs text-gray-400 mr-1">Insert:</span>
          {btn("blockquote", () => editor.chain().focus().toggleBlockquote().run(), {
            active: editor.isActive("blockquote"),
            label: "Blockquote",
            children: <span className="text-xs">" "</span>,
          })}
          <div className="relative">
            {btn("hr", () => {
              if (editor.isActive("horizontalRule")) {
                setOpenPicker(openPicker === "divider" ? null : "divider");
              } else {
                editor.chain().focus().insertContent({
                  type: "horizontalRule",
                  attrs: { thickness: 2, colour: null },
                }).run();
              }
            }, {
              active: editor.isActive("horizontalRule") || openPicker === "divider",
              label: editor.isActive("horizontalRule") ? "Configure divider" : "Insert divider",
              children: <span className="text-xs">—</span>,
            })}
            {openPicker === "divider" && editor.isActive("horizontalRule") && (
              <DividerConfig editor={editor} onClose={() => setOpenPicker(null)} />
            )}
          </div>

          {divider}

          {/* History + Clear */}
          <span className="text-xs text-gray-400 mr-1">History:</span>
          {btn("undo", () => editor.chain().focus().undo().run(), {
            disabled: !editor.can().undo(),
            label: "Undo",
            shortcut: "⌘Z",
            children: <span className="text-sm">↶</span>,
          })}
          {btn("redo", () => editor.chain().focus().redo().run(), {
            disabled: !editor.can().redo(),
            label: "Redo",
            shortcut: "⌘⇧Z",
            children: <span className="text-sm">↷</span>,
          })}

          {divider}

          {btn("clear", () => editor.chain().focus().unsetAllMarks().clearNodes().run(), {
            label: "Clear formatting",
            children: <span className="text-xs">Clear</span>,
          })}
        </div>
      )}
    </div>
  );
}
