import React from "react";
import { HeroData, TemplateStyle } from "@/types/blocks";

interface HeroRendererProps {
  data: HeroData;
  style: TemplateStyle;
}

export default function HeroRenderer({ data, style }: HeroRendererProps) {
  return (
    <div
      style={{
        height: style.heroHeight,
        borderRadius: style.heroBorderRadius,
        margin: style.heroMargin,
        overflow: "hidden",
        backgroundColor: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {data.imageUrl ? (
        <img
          src={data.imageUrl}
          alt={data.alt || "Hero image"}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span style={{ color: "#9ca3af", fontSize: "14px" }}>
          Hero image
        </span>
      )}
    </div>
  );
}
