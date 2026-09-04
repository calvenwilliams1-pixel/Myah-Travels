import React from "react";
import { BodyData, TemplateStyle } from "@/types/blocks";
import CleanTipTapRenderer from "./CleanTipTapRenderer";

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
      <CleanTipTapRenderer content={data.tiptapJson} />
    </div>
  );
}
