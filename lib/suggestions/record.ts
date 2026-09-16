import { upsertFieldValue } from "./field-values";
import { upsertEntity } from "./entities";
import { FIELD_KEYS, ENTITY_KINDS } from "./field-keys";

// ============================================================
// RECORDING (Phase 7.8)
// Fire-and-forget helpers called from API routes after a successful
// save. Every failure is caught and logged so a suggestion-system
// problem never breaks a real write.
// ============================================================

async function safe(promises: Promise<void>[]): Promise<void> {
  try {
    await Promise.all(promises);
  } catch (err) {
    console.warn("[suggestions] record failed:", (err as Error).message);
  }
}

export async function recordSegmentFields(segment: {
  title?: string | null;
  location?: string | null;
  referenceLabel?: string | null;
}): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (segment.title) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.SEGMENT_TITLE, value: segment.title }));
  if (segment.location) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.SEGMENT_LOCATION, value: segment.location }));
  if (segment.referenceLabel) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.SEGMENT_REFERENCE_LABEL, value: segment.referenceLabel }));
  await safe(tasks);
}

export async function recordStayFields(stay: {
  hotelName?: string | null;
  address?: string | null;
  notes?: string | null;
}): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (stay.hotelName) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.STAY_HOTEL_NAME, value: stay.hotelName }));
  if (stay.address) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.STAY_ADDRESS, value: stay.address }));
  if (stay.notes) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.STAY_NOTES, value: stay.notes }));

  // Upsert a hotel entity with identity metadata
  if (stay.hotelName) {
    const identity: Record<string, string> = {};
    if (stay.address) identity.address = stay.address;
    tasks.push(
      upsertEntity({
        kind: ENTITY_KINDS.HOTEL,
        canonicalName: stay.hotelName,
        identity,
      })
    );
  }
  await safe(tasks);
}

export async function recordLegFields(leg: {
  origin?: string | null;
  destination?: string | null;
  operator?: string | null;
  identifier?: string | null;
}): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (leg.origin) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.LEG_ORIGIN, value: leg.origin }));
  if (leg.destination) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.LEG_DESTINATION, value: leg.destination }));
  if (leg.operator) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.LEG_OPERATOR, value: leg.operator }));
  if (leg.identifier) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.LEG_IDENTIFIER, value: leg.identifier }));

  // Upsert an airline/operator entity
  if (leg.operator) {
    tasks.push(
      upsertEntity({
        kind: ENTITY_KINDS.AIRLINE,
        canonicalName: leg.operator,
        identity: {},
      })
    );
  }
  await safe(tasks);
}

export async function recordSectionFields(section: {
  title?: string | null;
  baseCity?: string | null;
}): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (section.title) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.SECTION_TITLE, value: section.title }));
  if (section.baseCity) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.SECTION_BASE_CITY, value: section.baseCity }));
  await safe(tasks);
}

export async function recordDayFields(day: { title?: string | null }): Promise<void> {
  const tasks: Promise<void>[] = [];
  if (day.title) tasks.push(upsertFieldValue({ fieldKey: FIELD_KEYS.DAY_TITLE, value: day.title }));
  await safe(tasks);
}
