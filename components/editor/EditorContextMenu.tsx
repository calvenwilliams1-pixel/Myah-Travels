"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { CONTEXT_MENU_COMMANDS } from "@/lib/editor/commands";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";
import ColorPicker from "./pickers/ColorPicker";
import FontFamilyPicker from "./pickers/FontFamilyPicker";
import FontSizePicker from "./pickers/FontSizePicker";

interface EditorContextMenuProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLElement>;
}

interface MenuPosition {
  x: number;
  y: number;
}

type SubmenuKind = null | "colour-text" | "colour-highlight" | "font" | "size";

export default function EditorContextMenu({ editor, containerRef }: EditorContextMenuProps) {
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [submenu, setSubmenu] = useState<SubmenuKind>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOpen = position !== null;

  useFocusRestore(isOpen);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onContextMenu(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".ProseMirror")) return;
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const isKeyboardTriggered = e.clientX === 0 && e.clientY === 0;
      if (isKeyboardTriggered) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const r = sel.getRangeAt(0).getBoundingClientRect();
          setPosition({ x: r.left - rect.left, y: r.bottom - rect.top + 4 });
        } else {
          setPosition({ x: 20, y: 20 });
        }
      } else {
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
      setHighlightIndex(0);
      setSubmenu(null);
    }

    el.addEventListener("contextmenu", onContextMenu);
    return () => el.removeEventListener("contextmenu", onContextMenu);
  }, [containerRef]);

  useEffect(() => {
    if (!position) return;

    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPosition(null);
        setSubmenu(null);
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (submenu) {
          setSubmenu(null);
        } else {
          setPosition(null);
        }
        return;
      }
      const total = CONTEXT_MENU_COMMANDS.length + 4; // +4 for the 4 submenu rows
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, total - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (highlightIndex < CONTEXT_MENU_COMMANDS.length) {
          const cmd = CONTEXT_MENU_COMMANDS[highlightIndex];
          if (cmd) {
            cmd.run(editor);
            setPosition(null);
          }
        }
      }
    }

    function onScroll() {
      setPosition(null);
      setSubmenu(null);
    }

    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [position, editor, highlightIndex, submenu]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      menuRef.current.focus();
    }
  }, [isOpen]);

  if (!position) return null;

  const SUBMENUS: { id: SubmenuKind; label: string }[] = [
    { id: "colour-text", label: "Text colour..." },
    { id: "colour-highlight", label: "Highlight..." },
    { id: "font", label: "Font..." },
    { id: "size", label: "Size..." },
  ];

  return (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] focus:outline-none"
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

      <div className="border-t border-gray-100 my-1" />

      {SUBMENUS.map((sub, i) => {
        const idx = CONTEXT_MENU_COMMANDS.length + i;
        const highlighted = idx === highlightIndex;
        const active = submenu === sub.id;
        return (
          <div key={sub.id} className="relative">
            <button
              type="button"
              role="menuitem"
              onMouseEnter={() => setHighlightIndex(idx)}
              onClick={() => setSubmenu(active ? null : sub.id)}
              className={
                "w-full text-left px-3 py-1.5 text-sm flex items-center justify-between " +
                (active ? "bg-primary/10 text-primary " : "") +
                (highlighted ? "bg-gray-100 " : "hover:bg-gray-50")
              }
            >
              <span>{sub.label}</span>
              <span className="text-xs text-gray-400 ml-3">▸</span>
            </button>
            {active && (
              <div className="absolute left-full top-0 ml-1 z-50">
                {sub.id === "colour-text" && <ColorPicker editor={editor} kind="text" onClose={() => { setPosition(null); setSubmenu(null); }} />}
                {sub.id === "colour-highlight" && <ColorPicker editor={editor} kind="highlight" onClose={() => { setPosition(null); setSubmenu(null); }} />}
                {sub.id === "font" && <FontFamilyPicker editor={editor} onClose={() => { setPosition(null); setSubmenu(null); }} />}
                {sub.id === "size" && <FontSizePicker editor={editor} onClose={() => { setPosition(null); setSubmenu(null); }} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
