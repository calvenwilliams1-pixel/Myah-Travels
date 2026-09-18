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
 *
 * Focus is restored in two cases:
 *   1. `isOpen` transitions from true to false while mounted.
 *   2. The component unmounts while `isOpen` is still true (e.g. the
 *      parent closes the popover by unmounting it).
 */
export function useFocusRestore(isOpen: boolean): void {
  const triggerRef = useRef<HTMLElement | null>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  useEffect(() => {
    if (isOpen) {
      triggerRef.current =
        typeof document !== "undefined" ? (document.activeElement as HTMLElement) : null;
    } else if (triggerRef.current) {
      const el = triggerRef.current;
      triggerRef.current = null;
      requestAnimationFrame(() => {
        el?.focus?.();
      });
    }
  }, [isOpen]);

  // Restore on unmount if the component is being torn down while still
  // considered open. Covers the "parent closes by unmounting" pattern.
  useEffect(() => {
    return () => {
      if (isOpenRef.current && triggerRef.current) {
        const el = triggerRef.current;
        triggerRef.current = null;
        el.focus?.();
      }
    };
  }, []);
}
