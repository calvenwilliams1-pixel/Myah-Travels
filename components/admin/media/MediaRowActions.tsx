"use client";

import React, { useState } from "react";
import MoveFileModal from "./MoveFileModal";

interface MediaRowActionsProps {
  mediaId: number;
  fileName: string;
  currentFolderId: number | null;
  deleteAction: (formData: FormData) => void | Promise<void>;
}

export default function MediaRowActions({
  mediaId,
  fileName,
  currentFolderId,
  deleteAction,
}: MediaRowActionsProps) {
  const [moving, setMoving] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setMoving(true)}
        className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
      >
        Move
      </button>
      <form action={deleteAction}>
        <input type="hidden" name="id" value={mediaId} />
        <button
          type="submit"
          className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
        >
          Delete
        </button>
      </form>
      {moving && (
        <MoveFileModal
          mediaId={mediaId}
          fileName={fileName}
          currentFolderId={currentFolderId}
          onClose={() => setMoving(false)}
        />
      )}
    </div>
  );
}
