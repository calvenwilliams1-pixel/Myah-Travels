import { useEffect, useRef } from "react";

/**
 * Restores focus to whatever element was focused when a component
 * opened. Use on modals, popovers, and context menus so keyboard and
 * screen-reader users don't lose their place on close.
 *
 * Usage:
 *   useFocusRestore(isOpen);
 *
 * Pass `isOpen` as the boolean that controls visibility.
 */
export function useFocusRestore(isOpen: boolean): void {
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = (typeof document !== "undefined"
        ? (document.activeElement as HTMLElement)
        : null);
    } else if (triggerRef.current) {
      // Defer restore to next tick so the closing render finishes first
      const el = triggerRef.current;
      triggerRef.current = null;
      requestAnimationFrame(() => {
        el?.focus?.();
      });
    }
  }, [isOpen]);
}
