"use client";

import React from "react";

interface CalloutBoxProps {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}

export default function CalloutBox({
  type = "info",
  children,
}: CalloutBoxProps) {
  const styles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    tip: "bg-emerald-50 border-emerald-200 text-emerald-800",
  };

  const icons = {
    info: "ℹ️",
    warning: "⚠️",
    tip: "💡",
  };

  return (
    <div className={`${styles[type]} border-l-4 rounded-r-lg px-4 py-3 my-4`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{icons[type]}</span>
        <div>{children}</div>
      </div>
    </div>
  );
}
