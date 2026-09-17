import { db } from "@/lib/db";
import { colorPresets } from "@/drizzle/schema";
import { eq, and, asc } from "drizzle-orm";

export type PresetKind = "text" | "highlight";

export interface ColorPreset {
  id: number;
  name: string;
  hex: string;
  kind: string;
  isDefault: boolean;
  isActive: boolean;
  position: number;
  createdAt: string | null;
  updatedAt: string | null;
}

// Curated values. Kept here as the source of truth that survives any
// overwrite — restoreDefaults() re-applies these directly, no DB lookup.
export const CURATED_DEFAULTS: Array<{ name: string; hex: string; kind: PresetKind; position: number }> = [
  { name: "Primary", hex: "#4A7C59", kind: "text", position: 1 },
  { name: "Accent", hex: "#6B9AC4", kind: "text", position: 2 },
  { name: "Muted", hex: "#6B7280", kind: "text", position: 3 },
  { name: "Success", hex: "#15803D", kind: "text", position: 4 },
  { name: "Warning", hex: "#B45309", kind: "text", position: 5 },
  { name: "Danger", hex: "#B91C1C", kind: "text", position: 6 },
  { name: "Yellow", hex: "#FEF08A", kind: "highlight", position: 1 },
  { name: "Blue", hex: "#BFDBFE", kind: "highlight", position: 2 },
  { name: "Green", hex: "#BBF7D0", kind: "highlight", position: 3 },
  { name: "Pink", hex: "#FBCFE8", kind: "highlight", position: 4 },
  { name: "Orange", hex: "#FED7AA", kind: "highlight", position: 5 },
  { name: "Purple", hex: "#DDD6FE", kind: "highlight", position: 6 },
];

function normalizeHex(hex: string): string {
  return hex.trim().toUpperCase();
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-F]{6}$/.test(hex);
}

export async function listPresets(kind?: PresetKind, includeInactive = false): Promise<ColorPreset[]> {
  const base = db.select().from(colorPresets);
  const rows = kind
    ? await db.select().from(colorPresets).where(eq(colorPresets.kind, kind)).orderBy(asc(colorPresets.position))
    : await db.select().from(colorPresets).orderBy(asc(colorPresets.kind), asc(colorPresets.position));
  const filtered = includeInactive ? rows : rows.filter((r) => r.isActive);
  return filtered as ColorPreset[];
}

/**
 * Strict create. Rejects if a preset with the same (name, kind) already
 * exists — overwriting is only through updatePreset().
 */
export async function createPreset(name: string, hex: string, kind: PresetKind): Promise<ColorPreset | { error: string }> {
  const trimmed = name.trim();
  const normalized = normalizeHex(hex);
  if (!trimmed || !isValidHex(normalized)) return { error: "Invalid name or hex" };

  const existing = await db
    .select()
    .from(colorPresets)
    .where(and(eq(colorPresets.name, trimmed), eq(colorPresets.kind, kind)))
    .limit(1);

  if (existing.length > 0) {
    return { error: "A preset with that name already exists for this kind" };
  }

  const created = await db
    .insert(colorPresets)
    .values({ name: trimmed, hex: normalized, kind, isDefault: false, isActive: true, position: 100 })
    .returning();
  return created[0] as ColorPreset;
}

/**
 * Update a preset's hex. Renames are not allowed — name is the identity.
 * Setting a preset to its curated hex does NOT restore isDefault=true;
 * that only happens through restoreDefaults().
 */
export async function updatePreset(id: number, hex: string): Promise<ColorPreset | null> {
  const normalized = normalizeHex(hex);
  if (!isValidHex(normalized)) return null;

  const result = await db
    .update(colorPresets)
    .set({ hex: normalized, isDefault: false, updatedAt: new Date().toISOString() })
    .where(eq(colorPresets.id, id))
    .returning();
  return (result[0] as ColorPreset) ?? null;
}

/**
 * Soft delete. Filters out of pickers, keeps the row for history.
 */
export async function deactivatePreset(id: number): Promise<void> {
  await db
    .update(colorPresets)
    .set({ isActive: false, updatedAt: new Date().toISOString() })
    .where(eq(colorPresets.id, id));
}

/**
 * Restore all curated defaults to their seed values, active state, and
 * isDefault=true. Mechanism: upsert per curated entry against the
 * (name, kind) unique index. No read-then-write — atomic per entry.
 */
export async function restoreDefaults(): Promise<number> {
  let count = 0;
  // Synchronous transaction callback — see seed script for context.
  db.transaction((tx) => {
    for (const preset of CURATED_DEFAULTS) {
      tx
        .insert(colorPresets)
        .values({
          name: preset.name,
          hex: preset.hex,
          kind: preset.kind,
          isDefault: true,
          isActive: true,
          position: preset.position,
        })
        .onConflictDoUpdate({
          target: [colorPresets.name, colorPresets.kind],
          set: {
            hex: preset.hex,
            isDefault: true,
            isActive: true,
            position: preset.position,
            updatedAt: new Date().toISOString(),
          },
        })
        .run();
      count++;
    }
  });
  return count;
}

export async function getPresetById(id: number): Promise<ColorPreset | null> {
  const result = await db.select().from(colorPresets).where(eq(colorPresets.id, id)).limit(1);
  return (result[0] as ColorPreset) ?? null;
}
