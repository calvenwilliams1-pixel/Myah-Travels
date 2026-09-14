"use client";

import React from "react";
import { openPickerOnClick } from "@/lib/ui/openPicker";

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  type?: "date" | "time" | "datetime-local";
}

export default function DateInput({ className, ...props }: DateInputProps) {
  return (
    <input
      {...props}
      className={
        className ||
        "w-full px-3 py-2 border border-primary/30 rounded-lg text-base cursor-pointer"
      }
      onClick={openPickerOnClick}
    />
  );
}
