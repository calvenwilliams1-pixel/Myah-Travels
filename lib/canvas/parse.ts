import { CanvasDocument } from "@/types/canvas";

export function parseCanvasDocument(json: string): CanvasDocument | null {
  try {
    const doc = JSON.parse(json);
    
    if (typeof doc !== "object" || doc === null) return null;
    if (doc.schemaVersion !== 1) return null;
    if (!Array.isArray(doc.elements)) return null;
    if (typeof doc.canvas !== "object" || doc.canvas === null) return null;
    if (typeof doc.canvas.width !== "number" || typeof doc.canvas.height !== "number") return null;
    
    for (const el of doc.elements) {
      if (!el.id || !el.type || typeof el.x !== "number" || typeof el.y !== "number") {
        return null;
      }
    }
    
    return doc as CanvasDocument;
  } catch {
    return null;
  }
}
