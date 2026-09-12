"use client";

import React from "react";

interface PrintButtonProps {
  className?: string;
  label?: string;
}

export default function PrintButton({
  className = "",
  label = "Print / Save PDF",
}: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`text-sm text-primary hover:underline print:hidden ${className}`}
    >
      {label}
    </button>
  );
}
