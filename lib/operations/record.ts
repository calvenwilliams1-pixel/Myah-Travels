// ============================================================
// OPERATIONS (Phase 7.8)
// Stub for recording undoable operations. Real undo is Phase 7.3.
// This module exists as a call site so the eventual table shape
// can be designed against real operations rather than guessed.
// ============================================================

export const OPERATION_TYPES = {
  BULK_ADD: "bulk_add",
  DUPLICATE_SEGMENT: "duplicate_segment",
  DUPLICATE_DAY: "duplicate_day",
  COPY_ACROSS_ITINERARIES: "copy_across_itineraries",
  EXTEND_DAY: "extend_day",
  DRAG_REORDER: "drag_reorder",
  RESET_ORDER: "reset_order",
} as const;

export type OperationType = (typeof OPERATION_TYPES)[keyof typeof OPERATION_TYPES];

export interface OperationRecord {
  type: OperationType;
  affectedIds: number[];
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export function recordOperation(
  type: OperationType,
  affectedIds: number[],
  metadata?: Record<string, unknown>
): void {
  const record: OperationRecord = {
    type,
    affectedIds,
    metadata,
    timestamp: new Date().toISOString(),
  };
  // Phase 7.3: replace console with real persistence
  if (process.env.NODE_ENV !== "production") {
    console.log("[operation]", JSON.stringify(record));
  }
}
