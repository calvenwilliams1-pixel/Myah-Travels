import { CanvasElement } from "@/types/canvas";

const STORAGE_KEY = "myah_canvas_clipboard";

export function saveToClipboard(elements: CanvasElement[]): void {
  try {
    const serialized = JSON.stringify(elements);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (err) {
    console.error("Failed to save to clipboard:", err);
  }
}

export function loadFromClipboard(): CanvasElement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CanvasElement[];
  } catch (err) {
    console.error("Failed to load from clipboard:", err);
    return [];
  }
}

export function clearClipboard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
