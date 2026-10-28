"use client";

import React, { useEffect, useState } from "react";
import PostRenderer from "@/components/editor/renderers/PostRenderer";
import type { BlockData, Template } from "@/types/blocks";

const VALID_BLOCK_TYPES = new Set([
  "title", "body", "callout", "hero", "image",
  "gallery", "quickFacts", "quote", "prosCons", "verdict",
]);

interface StateMessage {
  type: "state";
  blocks: BlockData[];
  template: Template;
}

function isValidState(msg: unknown): msg is StateMessage {
  if (!msg || typeof msg !== "object") return false;
  const m = msg as any;
  if (m.type !== "state") return false;
  if (!Array.isArray(m.blocks)) return false;
  for (const b of m.blocks) {
    if (!b || typeof b !== "object") return false;
    if (!VALID_BLOCK_TYPES.has(b.type)) return false;
    if (typeof b.id !== "string") return false;
  }
  const t = m.template;
  if (!t || typeof t !== "object") return false;
  if (typeof t.id !== "string" || typeof t.name !== "string") return false;
  if (!Array.isArray(t.sections)) return false;
  if (t.themeVariant && !["minimal", "travel", "review"].includes(t.themeVariant)) return false;
  return true;
}

export default function PreviewClient({ sessionId }: { sessionId?: string }) {
  const [state, setState] = useState<StateMessage | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const channel = new BroadcastChannel(`post-preview:${sessionId}`);
    channel.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (msg?.type === "closing") { window.close(); return; }
      if (isValidState(msg)) setState(msg);
    };
    try { channel.postMessage({ type: "ready" }); } catch {}
    function onPageHide() {
      try { channel.postMessage({ type: "closed" }); } catch {}
      channel.close();
    }
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      try { channel.postMessage({ type: "closed" }); } catch {}
      channel.close();
    };
  }, [sessionId]);

  if (!sessionId) {
    return <div className="p-8 text-center text-gray-600">Missing preview session. Open from the editor.</div>;
  }
  if (!state) {
    return <div className="p-8 text-center text-gray-500">Waiting for editor…</div>;
  }
  return (
    <div className="min-h-screen bg-white">
      <PostRenderer blocks={state.blocks} template={state.template} />
    </div>
  );
}
