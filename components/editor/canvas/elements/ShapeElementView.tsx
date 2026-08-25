"use client";

import React from "react";
import { CanvasElement } from "@/types/canvas";

interface ShapeElementViewProps {
  element: CanvasElement;
}

export default function ShapeElementView({ element }: ShapeElementViewProps) {
  const common: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: element.fillColor ?? "#e8b84b",
    border: `${element.borderWidth ?? 0}px solid ${element.borderColor ?? "transparent"}`,
    opacity: element.opacity ?? 1,
  };

  switch (element.shapeType) {
    case "circle":
      return (
        <div
          style={{
            ...common,
            borderRadius: "50%",
          }}
        />
      );

    case "diamond":
      return (
        <div
          style={{
            ...common,
            width: "70%",
            height: "70%",
            margin: "15%",
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          }}
        />
      );

    case "triangle":
      return (
        <div
          style={{
            ...common,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          }}
        />
      );

    case "line":
      return (
        <div
          style={{
            width: "100%",
            height: element.thickness ?? 2,
            backgroundColor: element.fillColor ?? "#333",
            opacity: element.opacity ?? 1,
          }}
        />
      );

    default: // square
      return (
        <div
          style={{
            ...common,
            borderRadius: element.borderRadius ?? 0,
          }}
        />
      );
  }
}
