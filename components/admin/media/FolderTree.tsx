"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FolderNode {
  id: number;
  name: string;
  parentId: number | null;
  fileCount: number;
  children: FolderNode[];
}

interface FolderTreeProps {
  onChanged?: () => void;
}

export default function FolderTree({ onChanged }: FolderTreeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("folderId");

  const [tree, setTree] = useState<FolderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<{ id: number; name: string } | null>(null);
  const [creating, setCreating] = useState<{ parentId: number | null; name: string } | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const data = await res.json();
        setTree(data.tree || []);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  function navigateTo(folderId: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (folderId === null) {
      params.delete("folderId");
    } else {
      params.set("folderId", String(folderId));
    }
    router.push(`/admin/media${params.toString() ? "?" + params.toString() : ""}`);
  }

  function toggleExpand(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createFolder() {
    if (!creating) return;
    const name = creating.name.trim();
    if (!name) {
      setCreating(null);
      return;
    }
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId: creating.parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.folder?.parentId) {
          setExpanded((prev) => new Set(prev).add(data.folder.parentId));
        }
        setCreating(null);
        await fetchTree();
        onChanged?.();
      }
    } catch {}
  }

  async function renameFolder() {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) {
      setEditing(null);
      return;
    }
    try {
      const res = await fetch(`/api/folders/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setEditing(null);
        await fetchTree();
        onChanged?.();
      }
    } catch {}
  }

  async function deleteFolder(id: number, name: string) {
    if (!confirm(`Delete folder "${name}"? Files inside will move to All files.`)) return;
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTree();
        onChanged?.();
        if (selectedId === String(id)) navigateTo(null);
      }
    } catch {}
  }

  function renderNode(node: FolderNode, depth: number) {
    const isSelected = selectedId === String(node.id);
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    const isEditing = editing?.id === node.id;

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1 rounded text-sm cursor-pointer ${
            isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => !isEditing && navigateTo(node.id)}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className="w-4 text-xs text-gray-500"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-base">📁</span>
          {isEditing ? (
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              onBlur={renameFolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") renameFolder();
                if (e.key === "Escape") setEditing(null);
              }}
              autoFocus
              className="flex-1 px-1 py-0.5 text-xs border border-gray-300 rounded"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{node.name}</span>
          )}
          <span className="text-xs text-gray-400">{node.fileCount}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditing({ id: node.id, name: node.name });
            }}
            className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-gray-800 px-1"
            aria-label="Rename"
            title="Rename"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteFolder(node.id, node.name);
            }}
            className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 px-1"
            aria-label="Delete"
            title="Delete"
          >
            ×
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-xs font-medium text-gray-700">Folders</span>
        <button
          type="button"
          onClick={() => setCreating({ parentId: null, name: "" })}
          className="text-xs text-primary hover:underline"
        >
          + New
        </button>
      </div>

      <div className="p-1 max-h-[500px] overflow-y-auto">
        <div
          className={`flex items-center gap-2 px-2 py-1 rounded text-sm cursor-pointer ${
            selectedId === null ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"
          }`}
          onClick={() => navigateTo(null)}
        >
          <span className="w-4" />
          <span className="text-base">📚</span>
          <span className="flex-1">All files</span>
        </div>

        {creating && creating.parentId === null && (
          <div className="flex items-center gap-1 px-2 py-1" style={{ paddingLeft: "20px" }}>
            <span className="w-4" />
            <span className="text-base">📁</span>
            <input
              type="text"
              value={creating.name}
              onChange={(e) => setCreating({ ...creating, name: e.target.value })}
              onBlur={createFolder}
              onKeyDown={(e) => {
                if (e.key === "Enter") createFolder();
                if (e.key === "Escape") setCreating(null);
              }}
              autoFocus
              placeholder="Folder name"
              className="flex-1 px-1 py-0.5 text-xs border border-gray-300 rounded"
            />
          </div>
        )}

        {loading ? (
          <p className="text-xs text-gray-500 text-center py-4">Loading…</p>
        ) : tree.length === 0 && !creating ? (
          <p className="text-xs text-gray-500 text-center py-4">No folders yet</p>
        ) : (
          tree.map((node) => renderNode(node, 0))
        )}
      </div>
    </div>
  );
}
