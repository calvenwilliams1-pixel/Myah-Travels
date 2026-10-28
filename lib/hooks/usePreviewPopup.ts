"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BlockData, Template } from "@/types/blocks";

interface UsePreviewPopupResult {
  isOpen: boolean;
  isBlocked: boolean;
  open: (blocks: BlockData[], template: Template) => void;
  send: (blocks: BlockData[], template: Template) => void;
  close: () => void;
}

interface StateMessage {
  type: "state";
  blocks: BlockData[];
  template: Template;
}

export function usePreviewPopup(): UsePreviewPopupResult {
  const [isOpen, setIsOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const popupRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const latestStateRef = useRef<StateMessage | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
    if (popupRef.current && !popupRef.current.closed) {
      try { popupRef.current.close(); } catch {}
    }
    popupRef.current = null;
    sessionIdRef.current = null;
    setIsOpen(false);
  }, []);

  useEffect(() => () => { cleanup(); }, [cleanup]);

  const open = useCallback((blocks: BlockData[], template: Template) => {
    setIsBlocked(false);
    const stateMsg: StateMessage = { type: "state", blocks, template };
    latestStateRef.current = stateMsg;

    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      try { channelRef.current?.postMessage(stateMsg); } catch {}
      return;
    }

    const sessionId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionIdRef.current = sessionId;

    const channel = new BroadcastChannel(`post-preview:${sessionId}`);
    channelRef.current = channel;

    channel.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (msg?.type === "ready") {
        // Popup (re)connected — mark open and (re)send current state.
        // Handles both the initial handshake and a Strict Mode remount.
        setIsOpen(true);
        try { channel.postMessage(stateMsg); } catch {}
      } else if (msg?.type === "closed") {
        // "closed" is a hint, not proof. React 18 Strict Mode fires effect
        // cleanup on first mount, which looks like a close but isn't. Verify
        // the actual popup window is closed before resetting state.
        setTimeout(() => {
          if (!popupRef.current || popupRef.current.closed) {
            setIsOpen(false);
            popupRef.current = null;
            try { channel.close(); } catch {}
            channelRef.current = null;
            sessionIdRef.current = null;
          }
        }, 100);
      }
    };

    const url = `/preview/post?s=${encodeURIComponent(sessionId)}`;
    const popup = window.open(url, "post-preview", "popup,width=720,height=900");
    if (!popup) {
      setIsBlocked(true);
      channel.close();
      channelRef.current = null;
      sessionIdRef.current = null;
      return;
    }

    popupRef.current = popup;
    setIsOpen(true);
  }, []);

  const send = useCallback((blocks: BlockData[], template: Template) => {
    const stateMsg: StateMessage = { type: "state", blocks, template };
    latestStateRef.current = stateMsg;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      try { channelRef.current?.postMessage(stateMsg); } catch {}
    }, 150);
  }, []);

  const close = useCallback(() => {
    try { channelRef.current?.postMessage({ type: "closing" }); } catch {}
    cleanup();
  }, [cleanup]);

  return { isOpen, isBlocked, open, send, close };
}
