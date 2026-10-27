"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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
      console.error("[ErrorBoundary] Render failed:", err);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          role="alert"
          className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center"
        >
          <p className="text-sm text-red-500">This section failed to render</p>
          <p className="text-xs text-gray-400 mt-1">
            Try refreshing the page. If the problem persists, remove and re-insert this block.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
