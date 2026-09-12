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

export interface DraftFinding {
  draftKey: string;       // the raw key without prefix, e.g. "itinerary:5:title"
  value: unknown;
  timestamp: number;
}

export function getFullDraftKey(draftKey: string): string {
  return KEY_PREFIX + draftKey;
}

export function writeDraft(draftKey: string, value: unknown): void {
  try {
    const record: DraftRecord = { value, timestamp: Date.now() };
    localStorage.setItem(getFullDraftKey(draftKey), JSON.stringify(record));
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("writeDraft failed:", err);
    }
  }
}

export function readDraft<T = unknown>(draftKey: string): T | null {
  try {
    const raw = localStorage.getItem(getFullDraftKey(draftKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftRecord;
    return parsed.value as T;
  } catch {
    return null;
  }
}

export function clearDraft(draftKey: string): void {
  try {
    localStorage.removeItem(getFullDraftKey(draftKey));
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("clearDraft failed:", err);
    }
  }
}

// ============================================================
// BULK OPERATIONS
// ============================================================

/**
 * Return every draft key currently stored (without the prefix).
 * Used by editor-level restore detection.
 */
export function getAllDraftKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(KEY_PREFIX)) {
        keys.push(fullKey.slice(KEY_PREFIX.length));
      }
    }
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("getAllDraftKeys failed:", err);
    }
  }
  return keys;
}

/**
 * Find every draft whose key belongs to the given entity.
 *
 * A draft "belongs to" an entity if its key matches either:
 *   - "{entityType}:{entityId}:*"  (the entity itself)
 *   - any descendant entity whose key contains the ancestor id
 *
 * The editor passes the top-level entity (itinerary), and this helper
 * returns drafts for the itinerary AND every descendant (section, day,
 * segment, stay) belonging to it.
 *
 * Since we don't have a schema graph in this module, the caller supplies
 * a predicate that decides whether a draft key belongs to the entity.
 */
export function findDraftsForEntity(
  belongsToEntity: (draftKey: string) => boolean
): DraftFinding[] {
  const findings: DraftFinding[] = [];
  const allKeys = getAllDraftKeys();

  for (const key of allKeys) {
    if (!belongsToEntity(key)) continue;

    try {
      const raw = localStorage.getItem(getFullDraftKey(key));
      if (!raw) continue;
      const parsed = JSON.parse(raw) as DraftRecord;
      findings.push({
        draftKey: key,
        value: parsed.value,
        timestamp: parsed.timestamp,
      });
    } catch (err) {
      if (typeof console !== "undefined") {
        console.warn("findDraftsForEntity: skipped malformed draft", key, err);
      }
    }
  }

  return findings;
}

/**
 * Clear every draft whose key satisfies the predicate.
 * Returns the number of drafts removed.
 */
export function clearDraftsForEntity(
  belongsToEntity: (draftKey: string) => boolean
): number {
  const allKeys = getAllDraftKeys();
  let removed = 0;

  for (const key of allKeys) {
    if (belongsToEntity(key)) {
      clearDraft(key);
      removed++;
    }
  }

  return removed;
}
