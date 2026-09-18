"use client";

import React from "react";
import { BodyData } from "@/types/blocks";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { serializeBodyContent } from "@/lib/editor/body-content";

interface BodyBlockEditorProps {
  data: BodyData;
  onChange: (data: Partial<BodyData>) => void;
}

export default function BodyBlockEditor({ data, onChange }: BodyBlockEditorProps) {
  return (
    <TipTapEditor
      initialContent={data.tiptapJson}
      onChange={(_html, json) => onChange({ tiptapJson: serializeBodyContent(json) })}
      placeholder="Write content..."
    />
  );
}
