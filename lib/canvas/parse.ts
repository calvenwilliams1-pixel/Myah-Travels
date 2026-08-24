import { CanvasDocument } from "@/types/canvas";

const MAX_JSON_LENGTH = 500_000;
const UNSAFE_KEYS = ["__proto__", "constructor", "prototype"];

function hasUnsafeKeys(obj: unknown, depth = 0): boolean {
  if (depth > 10) return false;
  if (typeof obj !== "object" || obj === null) return false;
  
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (UNSAFE_KEYS.includes(key)) return true;
    if (hasUnsafeKeys(record[key], depth + 1)) return true;
  }
  return false;
}

export function isCanvasDocument(obj: unknown): obj is CanvasDocument {
  if (typeof obj !== "object" || obj === null) return false;

  const doc = obj as Record<string, unknown>;

  if (typeof doc.schemaVersion !== "number" || doc.schemaVersion !== 1) return false;
  if (!Array.isArray(doc.elements)) return false;
  if (typeof doc.canvas !== "object" || doc.canvas === null) return false;

  const canvas = doc.canvas as Record<string, unknown>;
  if (typeof canvas.width !== "number" || typeof canvas.height !== "number") return false;

  for (const el of doc.elements) {
    if (typeof el !== "object" || el === null) return false;
    const element = el as Record<string, unknown>;

    // Required fields
    if (typeof element.id !== "string" || element.id === "") return false;
    if (typeof element.type !== "string" || element.type === "") return false;

    // Position/size - required for rendering
    if (typeof element.x !== "number") return false;
    if (typeof element.y !== "number") return false;

    // Optional fields - if present must be correct type
    if (element.width !== undefined && typeof element.width !== "number") return false;
    if (element.height !== undefined && typeof element.height !== "number") return false;
    if (element.rotation !== undefined && typeof element.rotation !== "number") return false;
    if (element.zIndex !== undefined && typeof element.zIndex !== "number") return false;
    if (element.visible !== undefined && typeof element.visible !== "boolean") return false;
    if (element.locked !== undefined && typeof element.locked !== "boolean") return false;
  }

  return true;
}

export function parseCanvasDocument(json: string, debug = false): CanvasDocument | null {
  if (typeof json !== "string" || json.trim() === "") {
    if (debug) console.warn("[parseCanvasDocument] Empty or non-string input");
    return null;
  }

  if (json.length > MAX_JSON_LENGTH) {
    if (debug) console.warn("[parseCanvasDocument] JSON too large");
    return null;
  }

  let doc: unknown;
  try {
    doc = JSON.parse(json);
  } catch (err) {
    if (debug) console.warn("[parseCanvasDocument] JSON parse error:", err);
    return null;
  }

  if (typeof doc !== "object" || doc === null) {
    if (debug) console.warn("[parseCanvasDocument] Parsed value is not an object");
    return null;
  }

  if (hasUnsafeKeys(doc)) {
    if (debug) console.warn("[parseCanvasDocument] Unsafe keys detected");
    return null;
  }

  if (!isCanvasDocument(doc)) {
    if (debug) console.warn("[parseCanvasDocument] Document failed validation");
    return null;
  }

  return JSON.parse(JSON.stringify(doc)) as CanvasDocument;
}
