import React from "react";
import { VerdictData, TemplateStyle } from "@/types/blocks";

interface VerdictRendererProps {
  data: VerdictData;
  style: TemplateStyle;
}

export default function VerdictRenderer({ data, style }: VerdictRendererProps) {
  const rating = data.rating || 0;

  return (
    <div
      style={{
        backgroundColor: style.verdictBackground,
        color: style.verdictTextColor,
        padding: style.verdictPadding,
        borderRadius: style.verdictBorderRadius,
        margin: style.verdictMargin,
        fontFamily: style.fontFamily,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            opacity: 0.7,
          }}
        >
          Verdict
        </span>
        <div style={{ display: "flex", gap: "2px" }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              style={{
                fontSize: "20px",
                color: rating >= star ? style.starColor : style.inactiveStarColor,
              }}
            >
              {"\u2605"}
            </span>
          ))}
        </div>
      </div>
      <p style={{ margin: 0, fontSize: "16px", lineHeight: "1.6" }}>
        {data.text || "No verdict yet"}
      </p>
    </div>
  );
}
