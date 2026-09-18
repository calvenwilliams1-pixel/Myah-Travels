// Versioned envelope for TipTap JSON stored in BodyData.tiptapJson.
//
// Shape history:
//   v1 (current) — { "version": 1, "content": <TipTap JSON> }
//   legacy       — bare <TipTap JSON>, no envelope
//
// The reader accepts both so existing rows keep rendering without
// migration. New writes always produce the v1 envelope.
//
// Layering intent:
//   Editor → serializeBodyContent() → storage (string)
//   storage (string) → deserializeBodyContent() → renderer (TipTap JSON)
//
// The renderer never sees the envelope. Versioning is a data-layer
// concern; rendering is a rendering concern.

export const BODY_CONTENT_VERSION = 1;

interface Envelope<T = unknown> {
  version: number;
  content: T;
}

function isEnvelope(value: unknown): value is Envelope {
  return (
    !!value &&
    typeof value === "object" &&
    "version" in value &&
    typeof (value as { version?: unknown }).version === "number" &&
    "content" in value
  );
}

/**
 * Wrap TipTap JSON (as produced by the editor's onUpdate) in a
 * versioned envelope. Input is the editor's JSON string. Output is
 * always a valid JSON string containing the envelope.
 */
export function serializeBodyContent(tiptapJson: string): string {
  let content: unknown;
  try {
    content = tiptapJson ? JSON.parse(tiptapJson) : null;
  } catch {
    // Malformed input — store a null content rather than garbage.
    content = null;
  }
  const envelope: Envelope = { version: BODY_CONTENT_VERSION, content };
  return JSON.stringify(envelope);
}

/**
 * Unwrap stored content into TipTap JSON. Accepts both the current
 * envelope shape and the legacy bare-doc shape so existing rows keep
 * working without migration. Returns null for empty, malformed, or
 * non-object input.
 */
export function deserializeBodyContent(raw: string): unknown {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (isEnvelope(parsed)) {
    return parsed.content;
  }
  // Legacy bare-doc shape.
  return parsed;
}

/**
 * Return the version of stored content, or null for legacy/malformed.
 * Present for future migrations — one canonical place to read the
 * version rather than parsing the envelope ad-hoc in migration scripts.
 */
export function getBodyContentVersion(raw: string): number | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (isEnvelope(parsed)) {
      return parsed.version;
    }
    return null;
  } catch {
    return null;
  }
}
