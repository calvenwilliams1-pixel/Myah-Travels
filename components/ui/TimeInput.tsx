"use client";

import React from "react";
import { openPickerOnClick } from "@/lib/ui/openPicker";

interface TimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: "time" | "datetime-local";
}

// Chromium's native time picker scrolls to a remembered minute position
// on open, which can land on arbitrary minutes like :49. step="60"
// constrains the picker to whole-minute options so the wheel only
// offers :00.
export default function TimeInput({ className, ...props }: TimeInputProps) {
  return (
    <input
      {...props}
      type={props.type ?? "time"}
      step={props.step ?? 60}
      className={
        className ||
        "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] cursor-pointer"
      }
      onClick={openPickerOnClick}
    />
  );
}
