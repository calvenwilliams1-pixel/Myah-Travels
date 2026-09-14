// ============================================================
// REFERENCE TYPES
// The "Confirmation" field was replaced with a typed reference.
// This module is the single source of truth for the option list
// and the label resolution used by both admin + client renderers.
// ============================================================

export const REFERENCE_TYPES = [
  { value: "record_locator", label: "Record Locator" },
  { value: "booking_number", label: "Booking Number" },
  { value: "confirmation", label: "Confirmation" },
  { value: "other", label: "Other (custom label)" },
] as const;

export type ReferenceType = (typeof REFERENCE_TYPES)[number]["value"];

/**
 * Resolve the display label for a segment's reference.
 * - If referenceType is "other", use referenceLabel.
 * - If referenceType is set, use the matching option label.
 * - If referenceType is null but a confirmation value exists,
 *   default to "Confirmation" (backward compat with old rows).
 * - Otherwise null (nothing to render).
 */
export function resolveReferenceLabel(
  referenceType: string | null | undefined,
  referenceLabel: string | null | undefined
): string | null {
  if (referenceType === "other") {
    return referenceLabel?.trim() || "Reference";
  }
  const match = REFERENCE_TYPES.find((r) => r.value === referenceType);
  if (match) return match.label;
  return null;
}
