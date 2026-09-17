"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { CONTEXT_MENU_COMMANDS } from "@/lib/editor/commands";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";

interface EditorContextMenuProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLElement>;
}

interface MenuPosition {
  x: number;
  y: number;
}

/**
 * Right-click menu for the editor. Also opens via the keyboard using
 * Shift+F10 or the Menu key (both fire a synthetic `contextmenu` event).
 * Supports arrow-key navigation and Enter/Space to select.
 */
export default function EditorContextMenu({ editor, containerRef }: EditorContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = position !== null;

  useFocusRestore(isOpen);

  // Open on contextmenu (mouse or keyboard)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".ProseMirror")) return;

      e.preventDefault();

      // Synthetic keyboard-triggered contextmenu events report clientX/Y
      // as 0 in most browsers. Fall back to anchoring to the selection
      // (or the container) instead.
      const rect = el!.getBoundingClientRect();
      const isKeyboardTriggered = e.clientX === 0 && e.clientY === 0;

      if (isKeyboardTriggered) {
        // Anchor near the selection start, or container top-left as fallback
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const r = sel.getRangeAt(0).getBoundingClientRect();
          setPosition({
            x: r.left - rect.left,
            y: r.bottom - rect.top + 4,
          });
        } else {
          setPosition({ x: 20, y: 20 });
        }
      } else {
        setPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
      setHighlightIndex(0);
    }

    el.addEventListener("contextmenu", onContextMenu);
    return () => el.removeEventListener("contextmenu", onContextMenu);
  }, [containerRef]);

  // Close on outside click, Esc, or scroll. Handle arrow keys + Enter.
  useEffect(() => {
    if (!position) return;

    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setPosition(null);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, CONTEXT_MENU_COMMANDS.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const cmd = CONTEXT_MENU_COMMANDS[highlightIndex];
        if (cmd) {
          cmd.run(editor);
          setPosition(null);
        }
      }
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
  }, [position, editor, highlightIndex]);

  // Auto-focus the menu when it opens so keyboard events land
  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] focus:outline-none"
      style={{ left: position.x, top: position.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {CONTEXT_MENU_COMMANDS.map((cmd, idx) => {
        const active = cmd.isActive?.(editor) ?? false;
        const enabled = cmd.isEnabled ? cmd.isEnabled(editor) : true;
        const highlighted = idx === highlightIndex;
        return (
          <button
            key={cmd.id}
            type="button"
            role="menuitem"
            disabled={!enabled}
            onMouseEnter={() => setHighlightIndex(idx)}
            onClick={() => {
              cmd.run(editor);
              setPosition(null);
            }}
            className={
              "w-full text-left px-3 py-1.5 text-sm flex items-center justify-between " +
              (active ? "bg-primary/10 text-primary " : "") +
              (highlighted ? "bg-gray-100 " : "") +
              (!enabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50")
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
