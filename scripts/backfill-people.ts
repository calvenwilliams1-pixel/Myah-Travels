// ============================================================
// BACKFILL — people from existing portal_members
// Walks all portal_members, deduplicates by normalized email,
// creates people records, links portal_members.person_id, and
// records trip history for each membership.
//
// Transaction-wrapped, idempotent — safe to re-run.
//
// Run: npx tsx scripts/backfill-people.ts
// ============================================================

import { db } from "../lib/db";
import { portalMembers, portals, personTripHistory } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import { upsertPersonByEmail } from "../lib/clients/people";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function run() {
  console.log("Backfilling people from existing portal_members...");

  // 1. Load all non-deleted members
  const members = await db
    .select()
    .from(portalMembers)
    .where(isNull(portalMembers.deletedAt));

  console.log("  Found " + members.length + " portal members");

  // 2. Group by normalized email, pick canonical name (most recently updated, then earliest created)
  const byEmail = new Map<string, typeof members>();
  for (const m of members) {
    const key = normalizeEmail(m.email);
    const arr = byEmail.get(key) ?? [];
    arr.push(m);
    byEmail.set(key, arr);
  }

  console.log("  Distinct emails: " + byEmail.size);

  let peopleCreated = 0;
  let membersLinked = 0;
  let tripsRecorded = 0;

  // 3. Transaction-wrapped writes
  // better-sqlite3 requires synchronous transaction callbacks.
  // We do reads + upserts outside the transaction, then batch the
  // writes inside a synchronous tx.
  for (const [normalizedEmail, group] of byEmail.entries()) {
    const sorted = [...group].sort((a, b) => {
      const aDate = a.createdAt ?? "";
      const bDate = b.createdAt ?? "";
      return bDate.localeCompare(aDate);
    });
    const nameSource = sorted.find((m) => m.name && m.name.trim());
    const canonicalName = nameSource?.name?.trim() || null;

    const person = await upsertPersonByEmail(normalizedEmail, canonicalName ?? undefined);
    if (person) peopleCreated++;

    // Fetch all portals involved (one read per unique portal id, cached)
    const portalIds = Array.from(new Set(group.map((m) => m.portalId)));
    const portalMap = new Map<number, typeof portals.$inferSelect>();
    for (const pid of portalIds) {
      const p = await db.select().from(portals).where(eq(portals.id, pid)).limit(1);
      if (p.length > 0) portalMap.set(pid, p[0]);
    }

    // Synchronous transaction for the writes
    db.transaction((tx) => {
      for (const member of group) {
        if (member.personId !== person.id) {
          tx.update(portalMembers)
            .set({ personId: person.id })
            .where(eq(portalMembers.id, member.id))
            .run();
          membersLinked++;
        }

        const p = portalMap.get(member.portalId);
        if (p) {
          tx.insert(personTripHistory)
            .values({
              personId: person.id,
              portalId: p.id,
              itineraryId: null,
              tripTitle: p.name,
              tripStartDate: p.departureDate ?? null,
              tripEndDate: p.returnDate ?? null,
              destination: null,
            })
            .run();
          tripsRecorded++;
        }
      }
    });
  }

  console.log("");
  console.log("  People records: " + peopleCreated);
  console.log("  Members linked: " + membersLinked);
  console.log("  Trip history rows: " + tripsRecorded);
  console.log("Done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("backfill-people failed:", err);
  process.exit(1);
});
