// Seeds curated colour presets on first run. Idempotent — guarded by a
// settings flag, so a second run does nothing.
//
// Run: npx tsx scripts/seed-color-presets.ts
// Also called by scripts/setup-db.js after table creation.

import { db } from "../lib/db";
import { colorPresets, settings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const SEED_FLAG_KEY = "color_presets_seeded";

type PresetKind = "text" | "highlight";

const CURATED: Array<{ name: string; hex: string; kind: PresetKind; position: number }> = [
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

async function run() {
  // Check the seed flag in the settings table
  const flagRow = await db.select().from(settings).where(eq(settings.key, SEED_FLAG_KEY)).limit(1);
  if (flagRow.length > 0 && flagRow[0].value === "true") {
    console.log("  color_presets: already seeded (skipping)");
    return;
  }

  // Idempotent per row. Preserves any existing user edits to the same
  // (name, kind) — the flag only gates the very first run.
  // better-sqlite3 + Drizzle: transaction callbacks must be synchronous.
  // Await inside causes "Transaction function cannot return a promise".
  db.transaction((tx) => {
    for (const preset of CURATED) {
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
        .onConflictDoNothing()
        .run();
    }
    tx
      .insert(settings)
      .values({ key: SEED_FLAG_KEY, value: "true" })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: "true" },
      })
      .run();
  });

  console.log("  color_presets: seeded " + CURATED.length + " presets");
  process.exit(0);
}

run().catch((err) => {
  console.error("seed-color-presets failed:", err);
  process.exit(1);
});
