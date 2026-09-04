import React from "react";
import { ImageData, TemplateStyle } from "@/types/blocks";

interface ImageRendererProps {
  data: ImageData;
  style: TemplateStyle;
}

export default function ImageRenderer({ data, style }: ImageRendererProps) {
  if (!data.imageUrl) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          color: "#9ca3af",
          border: "1px dashed #d1d5db",
          borderRadius: style.imageBorderRadius,
          margin: style.imageMargin,
          fontFamily: style.fontFamily,
        }}
      >
        Image placeholder
      </div>
    );
  }

  return (
    <figure style={{ margin: style.imageMargin, maxWidth: style.imageMaxWidth }}>
      <img
        src={data.imageUrl}
        alt={data.alt || "Image"}
        style={{
          width: "100%",
          borderRadius: style.imageBorderRadius,
        }}
      />
      {data.caption && (
        <figcaption
          style={{
            textAlign: "center",
            fontSize: "14px",
            color: style.bodyColor,
            marginTop: "8px",
            fontFamily: style.fontFamily,
          }}
        >
          {data.caption}
        </figcaption>
      )}
    </figure>
  );
}
