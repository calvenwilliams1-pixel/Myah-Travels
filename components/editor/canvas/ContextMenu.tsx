"use client";

import React, { useState, useEffect, useRef } from "react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onShowProperties: () => void;
  canGroup: boolean;
  canUngroup: boolean;
}

export default function ContextMenu({
  x,
  y,
  onClose,
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onBringForward,
  onSendBackward,
  onShowProperties,
  canGroup,
  canUngroup,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const [clampedPos, setClampedPos] = useState({ x, y });

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = x;
    let newY = y;

    if (x + rect.width > viewportWidth - 8) {
      newX = viewportWidth - rect.width - 8;
    }
    if (y + rect.height > viewportHeight - 8) {
      newY = viewportHeight - rect.height - 8;
    }

    setClampedPos({ x: newX, y: newY });
  }, [x, y]);

  const menuStyle: React.CSSProperties = {
    left: clampedPos.x,
    top: clampedPos.y,
  };

  const MenuItem = ({
    onClick,
    children,
    danger = false,
  }: {
    onClick: () => void;
    children: React.ReactNode;
    danger?: boolean;
  }) => (
    <button
      onClick={() => {
        onClick();
        onClose();
      }}
      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
        danger
          ? "text-red-700 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px]"
      style={menuStyle}
    >
      <MenuItem onClick={onShowProperties}>🎨 Properties...</MenuItem>
      <div className="border-t border-gray-100 my-1" />
      <MenuItem onClick={onDuplicate}>📋 Duplicate</MenuItem>
      <MenuItem onClick={onBringForward}>⬆ Bring Forward</MenuItem>
      <MenuItem onClick={onSendBackward}>⬇ Send Backward</MenuItem>
      {canGroup && <MenuItem onClick={onGroup}>🔗 Group</MenuItem>}
      {canUngroup && <MenuItem onClick={onUngroup}>🔓 Ungroup</MenuItem>}
      <div className="border-t border-gray-100 my-1" />
      <MenuItem onClick={onDelete} danger>🗑 Delete</MenuItem>
    </div>
  );
}
