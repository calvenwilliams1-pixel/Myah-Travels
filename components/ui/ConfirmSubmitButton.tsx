"use client";

import React from "react";
import { useFormStatus } from "react-dom";

interface ConfirmSubmitButtonProps {
  children: React.ReactNode;
  confirmMessage: string;
  className?: string;
  title?: string;
}

export default function ConfirmSubmitButton({
  children,
  confirmMessage,
  className = "",
  title,
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      title={title}
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
