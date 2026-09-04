import React from "react";
import { TitleData, TemplateStyle } from "@/types/blocks";

interface TitleRendererProps {
  data: TitleData;
  style: TemplateStyle;
}

export default function TitleRenderer({ data, style }: TitleRendererProps) {
  const Tag = `h${data.level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag
      style={{
        color: style.headingColor,
        fontFamily: style.fontFamily,
        fontSize: style.headingFontSize,
        fontWeight: style.headingFontWeight,
        margin: style.headingMargin,
      }}
    >
      {data.text || "Untitled Section"}
    </Tag>
  );
}
