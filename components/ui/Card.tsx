import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className = "", padding = "md" }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };
  
  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-card ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}
