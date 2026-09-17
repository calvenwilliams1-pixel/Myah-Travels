"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CharacterCount from "@tiptap/extension-character-count";
import FontSize from "@/lib/editor/font-size-extension";
import Toolbar from "./Toolbar";
import { CanvasBlockNode } from "./CanvasBlockNode";

interface TipTapEditorProps {
  initialContent?: string;
  onChange?: (html: string, json: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  contentType?: string;
}

function safeParseContent(content: string): any {
  if (!content || content.trim() === "") {
    return "";
  }
  
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

export default function TipTapEditor({
  initialContent = "",
  onChange,
  placeholder = "Start writing...",
  readOnly = false,
  contentType = "post",
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
      extensions: [
      StarterKit.configure({
        horizontalRule: false, // replaced by explicit HorizontalRule extension
      }),
      CanvasBlockNode,
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
      HorizontalRule,
      CharacterCount,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: safeParseContent(initialContent),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = JSON.stringify(editor.getJSON());
      onChange?.(html, json);
    },
  });

  if (!editor) {
    return <div className="h-[400px] bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {!readOnly && (
        <Toolbar
          editor={editor}
          contentType={contentType}
        />
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
