"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { sinkListItem, liftListItem } from "@tiptap/pm/schema-list";
import { isBareYouTubeUrl, extractYouTubeId } from "@/lib/editor/youtube";
import { buildExtensions } from "@/lib/editor/extensions";
import Toolbar from "./Toolbar";
import EditorContextMenu from "./EditorContextMenu";

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
    extensions: buildExtensions({
      forEditor: true,
      placeholder,
    }),
    content: safeParseContent(initialContent),
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
      },
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        if (!text) return false;
        if (!isBareYouTubeUrl(text)) return false;
        const videoId = extractYouTubeId(text);
        if (!videoId) return false;

        // Insert YouTube embed at cursor
        event.preventDefault();
        const { state, dispatch } = view;
        const nodeType = state.schema.nodes.youtubeEmbed;
        if (!nodeType) return false;
        const node = nodeType.create({ videoId });
        const tr = state.tr.replaceSelectionWith(node);
        dispatch(tr);
        return true;
      },
      handleKeyDown: (view, event) => {
        if (event.key !== "Tab") return false;
        const { state } = view;
        const { $from } = state.selection;

        // Check whether the cursor is inside a list item.
        let inList = false;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === "listItem") {
            inList = true;
            break;
          }
        }

        if (inList) {
          const listItemType = state.schema.nodes.listItem;
          if (!listItemType) return false;
          if (event.shiftKey) {
            return liftListItem(listItemType)(state, view.dispatch);
          } else {
            return sinkListItem(listItemType)(state, view.dispatch);
          }
        }

        // Not in a list — consume Tab so it doesn't move focus out of the editor.
        event.preventDefault();
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = JSON.stringify(editor.getJSON());
      onChange?.(html, json);
    },
  });

  // Ref used to scope the context menu to this editor instance.
  // Declared before any early return so hooks are called unconditionally.
  const containerRef = React.useRef<HTMLDivElement>(null);

  if (!editor) {
    return <div className="h-[400px] bg-gray-50 rounded-lg animate-pulse" />;
  }

  return (
    <div
      ref={containerRef}
      className="relative border border-gray-200 rounded-lg overflow-hidden"
    >
      {!readOnly && (
        <Toolbar
          editor={editor}
          contentType={contentType}
        />
      )}
      <EditorContent editor={editor} />
      {!readOnly && <EditorContextMenu editor={editor} containerRef={containerRef} />}
    </div>
  );
}
