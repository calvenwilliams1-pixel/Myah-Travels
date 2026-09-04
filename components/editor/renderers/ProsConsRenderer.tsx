import React from "react";
import { ProsConsData, TemplateStyle } from "@/types/blocks";

interface ProsConsRendererProps {
  data: ProsConsData;
  style: TemplateStyle;
}

export default function ProsConsRenderer({ data, style }: ProsConsRendererProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        margin: style.prosConsMargin,
        fontFamily: style.fontFamily,
      }}
    >
      <div
        style={{
          backgroundColor: style.prosBackground,
          padding: style.prosConsPadding,
          borderRadius: style.prosConsBorderRadius,
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#16a34a", margin: "0 0 12px 0" }}>
          Pros
        </h3>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
          {data.pros.map((pro, i) => (
            <li
              key={i}
              style={{
                marginBottom: "8px",
                fontSize: "14px",
                color: style.bodyColor,
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>{"\u2713"}</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        style={{
          backgroundColor: style.consBackground,
          padding: style.prosConsPadding,
          borderRadius: style.prosConsBorderRadius,
        }}
      >
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#dc2626", margin: "0 0 12px 0" }}>
          Cons
        </h3>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
          {data.cons.map((con, i) => (
            <li
              key={i}
              style={{
                marginBottom: "8px",
                fontSize: "14px",
                color: style.bodyColor,
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <span style={{ color: "#dc2626", fontWeight: 700, flexShrink: 0 }}>{"\u2717"}</span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
