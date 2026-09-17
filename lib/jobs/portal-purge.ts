import { db } from "@/lib/db";
import {
  portals,
  portalMembers,
  portalMagicLinks,
  portalSessions,
  portalItems,
  itineraries,
  notepadEntries,
  portalNotices,
  portalDocuments,
  portalFaqs,
  portalChecklistStates,
} from "@/drizzle/schema";
import { eq, and, isNull, isNotNull, lte, or } from "drizzle-orm";

const DEFAULT_GRACE_DAYS = 90;

interface PurgeResult {
  purged: number;
  keptItineraries: number;
}

/**
 * Computes the effective purge date for a portal.
 * Priority: keep_until (overrides in both directions), else return_date + grace days.
 * Returns null when the portal has no return_date and no keep_until — those
 * are treated as "not eligible for purge" (indefinite retention).
 */
function computePurgeDate(portal: {
  returnDate: string | null;
  keepUntil: string | null;
}): Date | null {
  if (portal.keepUntil) {
    const d = new Date(portal.keepUntil + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }
  if (portal.returnDate) {
    const d = new Date(portal.returnDate + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + DEFAULT_GRACE_DAYS);
    return d;
  }
  return null;
}

/**
 * Run the purge job. Finds all soft-deleted-or-expired portals whose
 * effective purge date has passed, and removes them + their dependent
 * portal data while preserving itineraries (detached + archived) and
 * people/notes/trip history.
 */
export async function runPortalPurge(): Promise<PurgeResult> {
  const now = new Date();
  const result: PurgeResult = { purged: 0, keptItineraries: 0 };

  // Fetch all portals that aren't already soft-deleted (we can choose to
  // also purge soft-deleted ones on the same schedule — they're dead anyway).
  const candidates = await db.select().from(portals);

  const toPurge: number[] = [];
  for (const p of candidates) {
    const purgeDate = computePurgeDate({
      returnDate: p.returnDate,
      keepUntil: p.keepUntil ?? null,
    });
    if (!purgeDate) continue;
    if (purgeDate <= now) {
      toPurge.push(p.id);
    }
  }

  if (toPurge.length === 0) return result;

  for (const portalId of toPurge) {
    // Everything in one transaction: delete, detach itineraries, keep people.
    db.transaction((tx) => {
      // 1. Detach + archive itineraries before deleting the portal
      const itinerariesForPortal = tx
        .select({ id: itineraries.id })
        .from(itineraries)
        .where(eq(itineraries.portalId, portalId))
        .all();

      for (const it of itinerariesForPortal) {
        tx.update(itineraries)
          .set({ portalId: null, isArchived: true })
          .where(eq(itineraries.id, it.id))
          .run();
        result.keptItineraries++;
      }

      // 2. Delete portal-level content that doesn't cascade
      tx.delete(portalItems).where(eq(portalItems.portalId, portalId)).run();
      tx.delete(portalNotices).where(eq(portalNotices.portalId, portalId)).run();
      tx.delete(portalDocuments).where(eq(portalDocuments.portalId, portalId)).run();
      tx.delete(portalFaqs).where(eq(portalFaqs.portalId, portalId)).run();
      tx.delete(portalChecklistStates).where(eq(portalChecklistStates.portalId, portalId)).run();
      tx.delete(notepadEntries).where(eq(notepadEntries.portalId, portalId)).run();
      tx.delete(portalSessions).where(eq(portalSessions.portalId, portalId)).run();
      tx.delete(portalMagicLinks).where(eq(portalMagicLinks.portalId, portalId)).run();

      // 3. Delete portal members — but preserve person_id relationships.
      //    portal_members are portal-scoped; the person record survives.
      tx.delete(portalMembers).where(eq(portalMembers.portalId, portalId)).run();

      // 4. Delete the portal itself
      tx.delete(portals).where(eq(portals.id, portalId)).run();

      result.purged++;
    });
  }

  return result;
}

/**
 * Preview which portals would purge on the next run. Doesn't mutate.
 */
export async function previewPurge(): Promise<
  Array<{ id: number; name: string; returnDate: string | null; keepUntil: string | null; purgeDate: string }>
> {
  const now = new Date();
  const all = await db.select().from(portals);
  const result: Array<{ id: number; name: string; returnDate: string | null; keepUntil: string | null; purgeDate: string }> = [];

  for (const p of all) {
    const purgeDate = computePurgeDate({ returnDate: p.returnDate, keepUntil: p.keepUntil ?? null });
    if (!purgeDate) continue;
    if (purgeDate <= now) {
      result.push({
        id: p.id,
        name: p.name,
        returnDate: p.returnDate ?? null,
        keepUntil: p.keepUntil ?? null,
        purgeDate: purgeDate.toISOString().slice(0, 10),
      });
    }
  }
  return result;
}
