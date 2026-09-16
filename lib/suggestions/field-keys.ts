// ============================================================
// FIELD KEYS (Phase 7.8)
// Single source of truth for every field that participates in
// suggestion memory. Nothing writes a literal field_key; everything
// references this constant. If a field is ever renamed, a single
// SQL UPDATE migrates stored values.
// ============================================================

export const FIELD_KEYS = {
  SEGMENT_TITLE: "segment.title",
  SEGMENT_LOCATION: "segment.location",
  SEGMENT_REFERENCE_LABEL: "segment.reference_label",

  LEG_ORIGIN: "leg.origin",
  LEG_DESTINATION: "leg.destination",
  LEG_OPERATOR: "leg.operator",
  LEG_IDENTIFIER: "leg.identifier",

  STAY_HOTEL_NAME: "stay.hotel_name",
  STAY_ADDRESS: "stay.address",
  STAY_NOTES: "stay.notes",

  SECTION_TITLE: "section.title",
  SECTION_BASE_CITY: "section.base_city",

  DAY_TITLE: "day.title",
} as const;

export type FieldKey = (typeof FIELD_KEYS)[keyof typeof FIELD_KEYS];

export const ALL_FIELD_KEYS: FieldKey[] = Object.values(FIELD_KEYS);

export const ENTITY_KINDS = {
  HOTEL: "hotel",
  AIRLINE: "airline",
  OPERATOR: "operator",
  CITY: "city",
} as const;

export type EntityKind = (typeof ENTITY_KINDS)[keyof typeof ENTITY_KINDS];

export const SOURCE_RANKING_OVERRIDES: Record<string, { fieldValueOutranksStaticAt: number }> = {
  [FIELD_KEYS.LEG_ORIGIN]: { fieldValueOutranksStaticAt: 5 },
  [FIELD_KEYS.LEG_DESTINATION]: { fieldValueOutranksStaticAt: 5 },
};

export function getSourceRankingOverride(fieldKey: string) {
  return SOURCE_RANKING_OVERRIDES[fieldKey] ?? null;
}
