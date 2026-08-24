"use client";

import React from "react";
import type { Editor } from "@tiptap/react";
import InsertCanvasBlockButton from "./InsertCanvasBlockButton";

interface ToolbarProps {
  editor: Editor;
  contentType?: string;
}

export default function Toolbar({ editor, contentType = "post" }: ToolbarProps) {
  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-emerald-100 text-emerald-800"
          : "text-gray-600 hover:bg-gray-100"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 flex flex-wrap gap-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        Bold
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        Italic
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        H2
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
      >
        H3
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        List
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        Numbered
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        Quote
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        Undo
      </ToolbarButton>
      
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        Redo
      </ToolbarButton>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <InsertCanvasBlockButton
        contentType={contentType}
        onInsert={(templateId, templateName, canvasJson) => {
          editor
            .chain()
            .focus()
            .insertContent({
              type: "canvasBlock",
              attrs: {
                templateId,
                templateName,
                canvasJson,
              },
            })
            .run();
        }}
      />
    </div>
  );
}
