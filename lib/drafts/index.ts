// ============================================================
// LOCAL DRAFT STORAGE
// Synchronous localStorage-backed draft persistence.
// Never throws; failures are logged and swallowed.
// ============================================================

const KEY_PREFIX = "myahtravels:draft:";

export interface DraftRecord {
  value: unknown;
  timestamp: number;
}

function fullKey(draftKey: string): string {
  return KEY_PREFIX + draftKey;
}

export function writeDraft(draftKey: string, value: unknown): void {
  try {
    const record: DraftRecord = { value, timestamp: Date.now() };
    localStorage.setItem(fullKey(draftKey), JSON.stringify(record));
  } catch (err) {
    // Never block editing on draft failure
    if (typeof console !== "undefined") {
      console.warn("writeDraft failed:", err);
    }
  }
}

export function readDraft<T = unknown>(draftKey: string): T | null {
  try {
    const raw = localStorage.getItem(fullKey(draftKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftRecord;
    return parsed.value as T;
  } catch {
    return null;
  }
}

export function clearDraft(draftKey: string): void {
  try {
    localStorage.removeItem(fullKey(draftKey));
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("clearDraft failed:", err);
    }
  }
}

export function getFullDraftKey(draftKey: string): string {
  return KEY_PREFIX + draftKey;
}
