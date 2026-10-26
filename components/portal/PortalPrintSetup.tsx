"use client";

import { useEffect } from "react";

/**
 * Marks the document body with a print-scope attribute when a glance
 * is present on the wall. Removed on unmount. The print CSS in
 * globals.css keys off `body[data-portal-print="glance"]` to hide
 * admin chrome (header, nav) and reset main padding, so a printed
 * glance is clean regardless of which route rendered it.
 */
export default function PortalPrintSetup({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    document.body.setAttribute("data-portal-print", "glance");
    return () => {
      document.body.removeAttribute("data-portal-print");
    };
  }, [enabled]);

  return null;
}
