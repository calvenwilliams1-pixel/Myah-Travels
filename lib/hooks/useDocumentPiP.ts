"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Local shape for Document Picture-in-Picture. Named to avoid colliding
// with the DOM-lib global that newer TypeScript versions ship.
interface DocumentPiPHandle {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
  window: Window | null;
}

type WindowWithPiP = Window & {
  documentPictureInPicture?: DocumentPiPHandle;
};

interface UseDocumentPiPResult {
  isSupported: boolean;
  isOpen: boolean;
  container: HTMLElement | null;
  open: (options?: { width?: number; height?: number }) => Promise<void>;
  close: () => void;
}

/**
 * Hook around the Document Picture-in-Picture API.
 * https://developer.chrome.com/docs/web-platform/document-picture-in-picture
 *
 * The PiP window is a real OS-level window — draggable across monitors
 * without viewport clamping. Falls back cleanly: when the API isn't
 * available (Firefox, Safari today), `isSupported` is false.
 */
export function useDocumentPiP(): UseDocumentPiPResult {
  const [isSupported, setIsSupported] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  const pipWindowRef = useRef<Window | null>(null);
  const pageHideRef = useRef<(() => void) | null>(null);
  const pipKeyDownRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const isOpeningRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as WindowWithPiP;
    setIsSupported(typeof w.documentPictureInPicture?.requestWindow === "function");
  }, []);

  const teardown = useCallback(() => {
    const pip = pipWindowRef.current;
    if (pip && !pip.closed) {
      if (pageHideRef.current) {
        try { pip.removeEventListener("pagehide", pageHideRef.current); } catch { /* ignore */ }
        pageHideRef.current = null;
      }
      if (pipKeyDownRef.current && pip.document) {
        try { pip.document.removeEventListener("keydown", pipKeyDownRef.current); } catch { /* ignore */ }
        pipKeyDownRef.current = null;
      }
      try { pip.close(); } catch { /* ignore */ }
    } else {
      pageHideRef.current = null;
      pipKeyDownRef.current = null;
    }
    pipWindowRef.current = null;
    if (isMountedRef.current) {
      setContainer(null);
      setIsOpen(false);
    }
  }, []);

  const open = useCallback(
    async (size?: { width?: number; height?: number }) => {
      if (typeof window === "undefined") return;
      const w = window as WindowWithPiP;
      if (typeof w.documentPictureInPicture?.requestWindow !== "function") return;

      if (isOpeningRef.current) return;
      isOpeningRef.current = true;

      try {
        if (pipWindowRef.current && !pipWindowRef.current.closed) {
          teardown();
        }

        let pip: Window | null = null;
        try {
          pip = await w.documentPictureInPicture.requestWindow({
            width: size?.width ?? 720,
            height: size?.height ?? 900,
          });
        } catch {
          teardown();
          return;
        }

        if (!pip || pip.closed) {
          return;
        }

        pipWindowRef.current = pip;

        try {
          const styleNodes = document.querySelectorAll('link[rel="stylesheet"], style');
          styleNodes.forEach((node) => {
            try {
              pip!.document.head.appendChild(node.cloneNode(true));
            } catch {
              // Ignore individual stylesheet copy failures.
            }
          });

          const rootStyles = getComputedStyle(document.documentElement);
          const cssVars: string[] = [];
          for (let i = 0; i < rootStyles.length; i++) {
            const prop = rootStyles[i];
            if (prop.startsWith("--")) {
              cssVars.push(prop + ": " + rootStyles.getPropertyValue(prop) + ";");
            }
          }
          if (cssVars.length > 0) {
            const styleEl = pip.document.createElement("style");
            styleEl.textContent = ":root {" + cssVars.join(" ") + "}";
            pip.document.head.appendChild(styleEl);
          }
        } catch {
          // Non-fatal — PiP still works, just without perfect styling.
        }

        const mount = pip.document.createElement("div");
        mount.className = "pip-preview-container";
        mount.style.padding = "0";
        mount.style.margin = "0";
        pip.document.body.appendChild(mount);
        pip.document.body.style.margin = "0";

        const onPipKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Escape") teardown();
        };
        pipKeyDownRef.current = onPipKeyDown;
        pip.document.addEventListener("keydown", onPipKeyDown);

        const onPageHide = () => teardown();
        pageHideRef.current = onPageHide;
        pip.addEventListener("pagehide", onPageHide);

        if (isMountedRef.current) {
          setContainer(mount);
          setIsOpen(true);
        }
      } finally {
        isOpeningRef.current = false;
      }
    },
    [teardown]
  );

  const close = useCallback(() => {
    teardown();
  }, [teardown]);

  useEffect(() => {
    return () => {
      const pip = pipWindowRef.current;
      if (pip && !pip.closed) {
        try { pip.close(); } catch { /* ignore */ }
      }
      pipWindowRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPageHide = () => teardown();
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [teardown]);

  return { isSupported, isOpen, container, open, close };
}
