"use client";

import React from "react";
import type { SaveState } from "@/lib/hooks/useAutosaveField";

interface SaveIndicatorProps {
  state: SaveState;
  className?: string;
  showText?: boolean;
}

export default function SaveIndicator({
  state,
  className = "",
  showText = true,
}: SaveIndicatorProps) {
  if (state === "idle") {
    return null;
  }

  const config: Record<
    Exclude<SaveState, "idle">,
    { dot: string; text: string; label: string }
  > = {
    saving: {
      dot: "bg-amber-500 animate-pulse",
      text: "text-amber-600",
      label: "Saving...",
    },
    saved: {
      dot: "bg-success",
      text: "text-success",
      label: "Saved",
    },
    error: {
      dot: "bg-danger",
      text: "text-danger",
      label: "Failed to save",
    },
  };

  const { dot, text, label } = config[state];

  return (
    <div className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <span className={`inline-block w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
      {showText && <span className={`font-medium ${text}`}>{label}</span>}
    </div>
  );
}
