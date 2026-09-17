"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { CONTEXT_MENU_COMMANDS } from "@/lib/editor/commands";

interface EditorContextMenuProps {
  editor: Editor;
  /** The outer wrapper of the editor. Right-clicks inside this fire the menu. */
  containerRef: React.RefObject<HTMLElement>;
}

interface MenuPosition {
  x: number;
  y: number;
}

/**
 * Right-click menu for the editor. Renders as a floating panel at the
 * click position. Uses the shared command list from commands.ts so it
 * always matches what the toolbar exposes.
 */
export default function EditorContextMenu({ editor, containerRef }: EditorContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onContextMenu(e: MouseEvent) {
      // Only fire when the click is inside the editor's editable content
      const target = e.target as HTMLElement;
      if (!target.closest(".ProseMirror")) return;

      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }

    el.addEventListener("contextmenu", onContextMenu);
    return () => el.removeEventListener("contextmenu", onContextMenu);
  }, [containerRef]);

  // Close on outside click, Esc, or scroll
  useEffect(() => {
    if (!position) return;

    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPosition(null);
    }
    function onScroll() {
      setPosition(null);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [position]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {CONTEXT_MENU_COMMANDS.map((cmd) => {
        const active = cmd.isActive?.(editor) ?? false;
        const enabled = cmd.isEnabled ? cmd.isEnabled(editor) : true;
        return (
          <button
            key={cmd.id}
            type="button"
            disabled={!enabled}
            onClick={() => {
              cmd.run(editor);
              setPosition(null);
            }}
            className={
              "w-full text-left px-3 py-1.5 text-sm flex items-center justify-between " +
              (active ? "bg-primary/10 text-primary " : "hover:bg-gray-50 ") +
              (!enabled ? "opacity-40 cursor-not-allowed" : "")
            }
          >
            <span>{cmd.label}</span>
            {cmd.shortcut && <span className="text-xs text-gray-400 ml-3">{cmd.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}
