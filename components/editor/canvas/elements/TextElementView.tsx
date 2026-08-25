"use client";

import React, { useState, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { CanvasElement } from "@/types/canvas";

interface TextElementViewProps {
  element: CanvasElement;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onBeginEdit?: () => void;
}

function safeParseContent(content: string): any {
  if (!content || content.trim() === "") return "";
  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

export default function TextElementView({ element, onUpdate, onBeginEdit }: TextElementViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: safeParseContent(element.richText || element.text || ""),
    editable: isEditing,
    editorProps: {
      attributes: {
        class: "w-full h-full outline-none",
        style: `font-size: ${element.fontSize ?? 16}px; color: ${element.color ?? "#333333"}; font-family: ${element.fontFamily ?? "Inter"}; text-align: ${element.textAlign ?? "left"}; font-weight: ${element.fontWeight ?? "normal"}; white-space: pre-wrap; word-break: break-word;`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = JSON.stringify(editor.getJSON());
      onUpdate(element.id, {
        richText: json,
        text: editor.getText(),
      });
    },
  });

  useEffect(() => {
    if (isEditing && editor) {
      editor.setEditable(true);
      editor.commands.focus("end");
    }
  }, [isEditing, editor]);

  if (!editor) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-400 text-sm">Loading editor...</span>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className="w-full h-full cursor-text"
      style={{
        opacity: element.opacity ?? 1,
      }}
      onDoubleClick={() => {
        if (onBeginEdit) onBeginEdit();
        setIsEditing(true);
      }}
    >
      <EditorContent editor={editor} />
      {!isEditing && (
        <div className="absolute inset-0" onClick={() => setIsEditing(true)} />
      )}
    </div>
  );
}
