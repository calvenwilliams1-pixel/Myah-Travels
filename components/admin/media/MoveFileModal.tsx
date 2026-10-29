"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface FolderNode {
  id: number;
  name: string;
  parentId: number | null;
  children: FolderNode[];
}

interface MoveFileModalProps {
  mediaId: number;
  fileName: string;
  currentFolderId: number | null;
  onClose: () => void;
}

function flattenFolders(nodes: FolderNode[], depth = 0): { id: number; label: string }[] {
  const result: { id: number; label: string }[] = [];
  for (const node of nodes) {
    result.push({ id: node.id, label: `${"  ".repeat(depth)}${node.name}` });
    result.push(...flattenFolders(node.children, depth + 1));
  }
  return result;
}

export default function MoveFileModal({ mediaId, fileName, currentFolderId, onClose }: MoveFileModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selected, setSelected] = useState<number | null>(currentFolderId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (!dlg.open) dlg.showModal();
    const handleClose = () => onClose();
    dlg.addEventListener("close", handleClose);
    return () => dlg.removeEventListener("close", handleClose);
  }, [onClose]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/folders");
        if (res.ok) {
          const data = await res.json();
          setFolders(data.tree || []);
        }
      } catch {}
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/${mediaId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: selected }),
      });
      if (!res.ok) {
        setError("Failed to move file");
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) dialogRef.current?.close();
  }

  const options = flattenFolders(folders);

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdrop}
      className="m-auto p-0 rounded-lg bg-white shadow-xl max-w-md w-full"
      style={{ border: "none" }}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">Move file</h3>
        <p className="text-sm text-gray-600 mb-4 truncate" title={fileName}>
          {fileName}
        </p>

        <label className="block text-xs text-gray-600 mb-1">Move to folder:</label>
        <select
          value={selected === null ? "root" : String(selected)}
          onChange={(e) => setSelected(e.target.value === "root" ? null : parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-4"
        >
          <option value="root">All files (no folder)</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="text-sm px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="text-sm px-3 py-2 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
