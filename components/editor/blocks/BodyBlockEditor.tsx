"use client";

import React from "react";
import { BodyData } from "@/types/blocks";
import TipTapEditor from "@/components/editor/TipTapEditor";
import {
  serializeBodyContent,
  deserializeBodyContent,
} from "@/lib/editor/body-content";

interface BodyBlockEditorProps {
  data: BodyData;
  onChange: (data: Partial<BodyData>) => void;
}

export default function BodyBlockEditor({ data, onChange }: BodyBlockEditorProps) {
  // Storage shape is a versioned envelope; the editor needs bare TipTap
  // JSON as a string. Unwrap before handing it to TipTapEditor, which
  // will JSON.parse it. On change, re-wrap before persisting.
  const unwrapped = deserializeBodyContent(data.tiptapJson);
  const initialContent = unwrapped ? JSON.stringify(unwrapped) : "";

  return (
    <TipTapEditor
      initialContent={initialContent}
      onChange={(_html, json) => onChange({ tiptapJson: serializeBodyContent(json) })}
      placeholder="Write content..."
    />
  );
}
