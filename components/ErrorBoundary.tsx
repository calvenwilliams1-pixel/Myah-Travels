"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Canvas render failed:", err);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center"
        >
          <p className="text-sm text-red-500">Canvas failed to render</p>
          <p className="text-xs text-gray-400 mt-1">
            Please try removing and re-inserting this block.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
