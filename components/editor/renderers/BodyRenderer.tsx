import React from "react";
import { BodyData, TemplateStyle } from "@/types/blocks";
import CleanTipTapRenderer from "./CleanTipTapRenderer";
import { deserializeBodyContent } from "@/lib/editor/body-content";

interface BodyRendererProps {
  data: BodyData;
  style: TemplateStyle;
}

export default function BodyRenderer({ data, style }: BodyRendererProps) {
  return (
    <div
      style={{
        color: style.bodyColor,
        fontFamily: style.fontFamily,
        lineHeight: style.bodyLineHeight,
      }}
    >
      <CleanTipTapRenderer content={deserializeBodyContent(data.tiptapJson)} />
    </div>
  );
}
