"use client";

import React, { useState } from "react";
import type { Editor } from "@tiptap/react";
import InsertCanvasBlockButton from "./InsertCanvasBlockButton";
import ColorPicker from "./pickers/ColorPicker";
import FontFamilyPicker from "./pickers/FontFamilyPicker";
import FontSizePicker from "./pickers/FontSizePicker";
import WordCount from "./pickers/WordCount";
import { COMMAND_GROUPS, cmdBold, cmdItalic, cmdUnderline } from "@/lib/editor/commands";

interface ToolbarProps {
  editor: Editor;
  contentType?: string;
}

type OpenPicker = null | "colour-text" | "colour-highlight" | "font" | "size";

export default function Toolbar({ editor, contentType = "post" }: ToolbarProps) {
  const [openPicker, setOpenPicker] = useState<OpenPicker>(null);
  const [showMore, setShowMore] = useState(false);

  if (!editor) return null;

  const cmdButton = (
    run: () => void,
    opts: { active?: boolean; disabled?: boolean; label: string; shortcut?: string; children: React.ReactNode }
  ) => (
    <button
      type="button"
      onClick={run}
      disabled={opts.disabled}
      title={opts.shortcut ? opts.label + " (" + opts.shortcut + ")" : opts.label}
      aria-label={opts.label}
      className={
        "px-2 py-1 rounded text-sm font-medium transition-colors " +
        (opts.active ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100") +
        (opts.disabled ? " opacity-40 cursor-not-allowed" : "")
      }
    >
      {opts.children}
    </button>
  );

  const divider = <span className="w-px h-6 bg-gray-300 mx-1" />;

  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50">
      <div className="px-3 py-2 flex flex-wrap items-center gap-1">
        {cmdButton(() => cmdBold.run(editor), {
          active: cmdBold.isActive?.(editor),
          label: cmdBold.label,
          shortcut: cmdBold.shortcut,
          children: <span className="font-bold">B</span>,
        })}
        {cmdButton(() => cmdItalic.run(editor), {
          active: cmdItalic.isActive?.(editor),
          label: cmdItalic.label,
          shortcut: cmdItalic.shortcut,
          children: <span className="italic">I</span>,
        })}
        {cmdButton(() => cmdUnderline.run(editor), {
          active: cmdUnderline.isActive?.(editor),
          label: cmdUnderline.label,
          shortcut: cmdUnderline.shortcut,
          children: <span className="underline">U</span>,
        })}

        {divider}

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
            <span
              className="w-4 h-4 rounded border border-gray-300"
              style={{ backgroundColor: editor.getAttributes("textStyle").color || "transparent" }}
            />
            A
          </button>
          {openPicker === "colour-text" && <ColorPicker editor={editor} kind="text" onClose={() => setOpenPicker(null)} />}
        </div>

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

        {COMMAND_GROUPS.find((g) => g.label === "Lists")?.commands.map((cmd) =>
          cmdButton(() => cmd.run(editor), {
            active: cmd.isActive?.(editor),
            disabled: cmd.isEnabled ? !cmd.isEnabled(editor) : false,
            label: cmd.label,
            shortcut: cmd.shortcut,
            children: cmd.id === "bullet-list" ? "•" : "1.",
          })
        )}

        <div className="ml-auto flex items-center gap-2">
          <WordCount editor={editor} />
          <button
            type="button"
            onClick={() => setShowMore(!showMore)}
            className="px-2 py-1 rounded text-xs text-gray-500 hover:bg-gray-100"
            title="More tools"
          >
            {showMore ? "Less" : "More"}
          </button>
        </div>
      </div>

      {showMore && (
        <div className="px-3 pb-2 flex flex-wrap items-center gap-1 border-t border-gray-100">
          {COMMAND_GROUPS.filter((g) => g.label !== "Text" && g.label !== "Lists").map((group) => (
            <React.Fragment key={group.label}>
              <span className="text-xs text-gray-400 mr-1">{group.label}:</span>
              {group.commands.map((cmd) =>
                cmdButton(() => cmd.run(editor), {
                  active: cmd.isActive?.(editor),
                  disabled: cmd.isEnabled ? !cmd.isEnabled(editor) : false,
                  label: cmd.label,
                  shortcut: cmd.shortcut,
                  children: cmd.label.slice(0, 3),
                })
              )}
              {divider}
            </React.Fragment>
          ))}
          <InsertCanvasBlockButton
            contentType={contentType}
            onInsert={(templateId, templateName, canvasJson) => {
              editor.chain().focus().insertContent({
                type: "canvasBlock",
                attrs: { templateId, templateName, canvasJson },
              }).run();
            }}
          />
        </div>
      )}
    </div>
  );
}
