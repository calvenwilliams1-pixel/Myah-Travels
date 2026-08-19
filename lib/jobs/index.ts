import { db } from "@/lib/db";
import { emailQueue, portalMagicLinks, portalSessions, posts, guides, reviews, clients, media, portalMembers, portalNotices, portalDocuments, portalFaqs } from "@/drizzle/schema";
import { eq, and, isNull, isNotNull, lte, or } from "drizzle-orm";
import { processEmailQueue } from "@/lib/email";

export async function runEmailProcessor(batchSize = 50) {
  console.log("Processing email queue...");
  const result = await processEmailQueue(batchSize);
  console.log(`Email queue: ${result.processed} processed, ${result.sent} sent, ${result.failed} failed`);
  return result;
}

export async function cleanupExpiredMagicLinks() {
  const now = new Date().toISOString();
  const cutoff90 = new Date();
  cutoff90.setDate(cutoff90.getDate() - 90);

  const result = await db.delete(portalMagicLinks)
    .where(or(
      and(lte(portalMagicLinks.expiresAt, now), isNull(portalMagicLinks.usedAt)),
      and(isNotNull(portalMagicLinks.usedAt), lte(portalMagicLinks.usedAt, cutoff90.toISOString()))
    ));
  return result.changes ?? 0;
}

export async function cleanupExpiredPortalSessions() {
  const result = await db.delete(portalSessions)
    .where(lte(portalSessions.expiresAt, new Date().toISOString()));
  return result.changes ?? 0;
}

export async function cleanupProcessedEmails(daysToKeep = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);

  const result = await db.delete(emailQueue)
    .where(and(
      lte(emailQueue.createdAt, cutoff.toISOString()),
      or(eq(emailQueue.status, "sent"), eq(emailQueue.status, "failed"))
    ));
  return result.changes ?? 0;
}

export async function purgeSoftDeletedRecords(daysToKeep = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysToKeep);
  const cutoffString = cutoff.toISOString();

  let total = 0;

  const postResult = await db.delete(posts)
    .where(and(isNotNull(posts.deletedAt), lte(posts.deletedAt, cutoffString)));
  total += postResult.changes ?? 0;

  const guideResult = await db.delete(guides)
    .where(and(isNotNull(guides.deletedAt), lte(guides.deletedAt, cutoffString)));
  total += guideResult.changes ?? 0;

  const reviewResult = await db.delete(reviews)
    .where(and(isNotNull(reviews.deletedAt), lte(reviews.deletedAt, cutoffString)));
  total += reviewResult.changes ?? 0;

  const clientResult = await db.delete(clients)
    .where(and(isNotNull(clients.deletedAt), lte(clients.deletedAt, cutoffString)));
  total += clientResult.changes ?? 0;

  const mediaResult = await db.delete(media)
    .where(and(isNotNull(media.deletedAt), lte(media.deletedAt, cutoffString)));
  total += mediaResult.changes ?? 0;

  const memberResult = await db.delete(portalMembers)
    .where(and(isNotNull(portalMembers.deletedAt), lte(portalMembers.deletedAt, cutoffString)));
  total += memberResult.changes ?? 0;

  const noticeResult = await db.delete(portalNotices)
    .where(and(isNotNull(portalNotices.deletedAt), lte(portalNotices.deletedAt, cutoffString)));
  total += noticeResult.changes ?? 0;

  const docResult = await db.delete(portalDocuments)
    .where(and(isNotNull(portalDocuments.deletedAt), lte(portalDocuments.deletedAt, cutoffString)));
  total += docResult.changes ?? 0;

  const faqResult = await db.delete(portalFaqs)
    .where(and(isNotNull(portalFaqs.deletedAt), lte(portalFaqs.deletedAt, cutoffString)));
  total += faqResult.changes ?? 0;

  return total;
}

export async function anonymizeInactiveClients(yearsToKeep = 2) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - yearsToKeep);

  const result = await db.update(clients)
    .set({
      fullName: "Anonymized Client",
      phone: null,
      email: null,
      customStatement: null,
      notes: null,
      consentIp: null,
      isAnonymized: true,
      anonymizedAt: new Date().toISOString(),
    })
    .where(and(
      eq(clients.isAnonymized, false),
      isNull(clients.deletedAt),
      lte(clients.createdAt, cutoff.toISOString())
    ));

  return result.changes ?? 0;
}

export async function runDailyCleanup() {
  console.log("Running daily cleanup...");
  
  const magicLinksDeleted = await cleanupExpiredMagicLinks();
  console.log(`Expired magic links deleted: ${magicLinksDeleted}`);

  const sessionsDeleted = await cleanupExpiredPortalSessions();
  console.log(`Expired portal sessions deleted: ${sessionsDeleted}`);

  const emailsDeleted = await cleanupProcessedEmails();
  console.log(`Processed emails deleted: ${emailsDeleted}`);

  const recordsPurged = await purgeSoftDeletedRecords();
  console.log(`Soft-deleted records purged: ${recordsPurged}`);

  return { magicLinksDeleted, sessionsDeleted, emailsDeleted, recordsPurged };
}

export async function runWeeklyCleanup() {
  console.log("Running weekly cleanup...");

  const clientsAnonymized = await anonymizeInactiveClients();
  console.log(`Inactive clients anonymized: ${clientsAnonymized}`);

  return { clientsAnonymized };
}

export async function publishScheduledPosts() {
  const now = new Date().toISOString();

  return db.transaction(async (tx) => {
    const postResult = await tx.update(posts)
      .set({ status: "published", publishedAt: now })
      .where(and(
        eq(posts.status, "scheduled"),
        isNull(posts.deletedAt),
        isNotNull(posts.scheduledAt),
        lte(posts.scheduledAt, now)
      ));

    const guideResult = await tx.update(guides)
      .set({ status: "published", publishedAt: now })
      .where(and(
        eq(guides.status, "scheduled"),
        isNull(guides.deletedAt),
        isNotNull(guides.scheduledAt),
        lte(guides.scheduledAt, now)
      ));

    const reviewResult = await tx.update(reviews)
      .set({ status: "published", publishedAt: now })
      .where(and(
        eq(reviews.status, "scheduled"),
        isNull(reviews.deletedAt),
        isNotNull(reviews.scheduledAt),
        lte(reviews.scheduledAt, now)
      ));

    const total = (postResult.changes ?? 0) + (guideResult.changes ?? 0) + (reviewResult.changes ?? 0);
    console.log(`Scheduled posts published: ${total}`);
    return total;
  });
}
