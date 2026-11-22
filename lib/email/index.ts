import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailQueue, emailSuppressions } from "@/drizzle/schema";
import { eq, and, or, lte, asc, inArray, sql } from "drizzle-orm";

const RESEND_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

if (!RESEND_KEY) {
  console.warn(
    "[email] RESEND_API_KEY is not set — emails will queue but not send. " +
    "Set it in .env to enable delivery."
  );
}

const EMAIL_FROM =
  process.env.EMAIL_FROM || "MyCalTravels <notifications@myahtravels.com>";

const MAX_ATTEMPTS = 3;
const RATE_LIMIT_MS = 500;

export async function isEmailSuppressed(
  email: string,
  type: string = "all_emails"
): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(emailSuppressions)
      .where(
        and(
          eq(emailSuppressions.email, email),
          or(
            eq(emailSuppressions.suppressedType, type),
            eq(emailSuppressions.suppressedType, "all_emails")
          )
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Failed to check suppression:", error);
    return false;
  }
}

export async function suppressEmail(
  email: string,
  type: string = "all_emails"
): Promise<void> {
  try {
    await db
      .insert(emailSuppressions)
      .values({ email, suppressedType: type })
      .onConflictDoNothing();
  } catch (error) {
    console.error("Failed to suppress email:", error);
  }
}

export async function unsuppressEmail(email: string): Promise<void> {
  try {
    await db.delete(emailSuppressions).where(eq(emailSuppressions.email, email));
  } catch (error) {
    console.error("Failed to unsuppress email:", error);
  }
}

export interface QueueEmailInput {
  toEmail: string;
  subject: string;
  body: string;
}

export async function queueEmail(input: QueueEmailInput): Promise<number | null> {
  try {
    const suppressed = await isEmailSuppressed(input.toEmail);
    if (suppressed) {
      console.log(`Email suppressed: ${input.toEmail}`);
      return null;
    }

    const result = await db.insert(emailQueue).values({
      toEmail: input.toEmail,
      subject: input.subject,
      body: input.body,
      status: "pending",
      attempts: 0,
    }).returning({ id: emailQueue.id });

    return result[0]?.id ?? null;
  } catch (error) {
    console.error("Failed to queue email:", error);
    return null;
  }
}

export async function queueBulkEmails(
  emails: QueueEmailInput[]
): Promise<number[]> {
  const queuedIds: number[] = [];

  for (const email of emails) {
    const id = await queueEmail(email);
    if (id) {
      queuedIds.push(id);
    }
  }

  return queuedIds;
}

export async function getPendingEmails(limit = 50) {
  try {
    return await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, "pending"))
      .orderBy(asc(emailQueue.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Failed to get pending emails:", error);
    return [];
  }
}

export async function claimEmailsForProcessing(limit = 50): Promise<number[]> {
  try {
    // Atomic claim: single UPDATE ... WHERE id IN (SELECT ... LIMIT n) RETURNING id.
    // better-sqlite3 is a synchronous, single-connection driver — all writes
    // serialize at the Node event-loop level regardless of journal mode. Two
    // concurrent callers therefore cannot both claim the same pending row.
    // (Note: this reasoning relies on single-connection serialization, not WAL.
    // If this ever moves behind a connection pool, revisit — a pool would allow
    // true concurrent writes and the atomicity would then depend on the SQL.)
    const claimed = await db
      .update(emailQueue)
      .set({ status: "processing" })
      .where(
        inArray(
          emailQueue.id,
          db
            .select({ id: emailQueue.id })
            .from(emailQueue)
            .where(eq(emailQueue.status, "pending"))
            .orderBy(asc(emailQueue.createdAt))
            .limit(limit)
        )
      )
      .returning({ id: emailQueue.id });

    return claimed.map((row) => row.id);
  } catch (error) {
    console.error("Failed to claim emails:", error);
    return [];
  }
}

export async function getEmailsByIds(ids: number[]) {
  if (ids.length === 0) return [];
  try {
    return await db
      .select()
      .from(emailQueue)
      .where(inArray(emailQueue.id, ids));
  } catch (error) {
    console.error("Failed to get emails by IDs:", error);
    return [];
  }
}

export async function getFailedEmails() {
  try {
    return await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, "failed"))
      .orderBy(asc(emailQueue.createdAt))
      .limit(50);
  } catch (error) {
    console.error("Failed to get failed emails:", error);
    return [];
  }
}

export async function markEmailSent(id: number): Promise<void> {
  try {
    await db
      .update(emailQueue)
      .set({
        status: "sent",
        sentAt: new Date().toISOString(),
      })
      .where(eq(emailQueue.id, id));
  } catch (error) {
    console.error("Failed to mark email sent:", error);
  }
}

export async function markEmailFailed(
  id: number,
  errorMessage: string
): Promise<void> {
  try {
    const email = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.id, id))
      .limit(1);

    if (email.length === 0) return;

    const currentAttempts = email[0].attempts ?? 0;
    const newAttempts = currentAttempts + 1;

    await db
      .update(emailQueue)
      .set({
        status: newAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
        attempts: newAttempts,
        lastAttemptAt: new Date().toISOString(),
        errorMessage,
      })
      .where(eq(emailQueue.id, id));
  } catch (error) {
    console.error("Failed to mark email failed:", error);
  }
}

export async function retryFailedEmails(): Promise<number> {
  try {
    const failed = await getFailedEmails();

    for (const email of failed) {
      await db
        .update(emailQueue)
        .set({ status: "pending", errorMessage: null })
        .where(eq(emailQueue.id, email.id));
    }

    return failed.length;
  } catch (error) {
    console.error("Failed to retry emails:", error);
    return 0;
  }
}

const STUCK_PROCESSING_MS = 15 * 60 * 1000;

function parseDbTime(stamp: string): number {
  // Rows carry two formats: SQLite CURRENT_TIMESTAMP defaults
  // ("YYYY-MM-DD HH:MM:SS", UTC) and ISO strings written by this app.
  const iso = stamp.includes("T") ? stamp : stamp.replace(" ", "T") + "Z";
  return new Date(iso).getTime();
}

/**
 * A send batch takes well under a minute (50 emails max, 500ms pacing plus
 * API time). Anything still "processing" after 15 minutes belongs to a run
 * that died mid-batch — return it to "pending" so it gets retried instead
 * of being stranded forever (previously nothing ever looked at the status
 * again, so a crashed run silently ate those emails).
 */
export async function recoverStuckProcessingEmails(): Promise<number> {
  try {
    const stuck = await db
      .select()
      .from(emailQueue)
      .where(eq(emailQueue.status, "processing"));

    let recovered = 0;
    for (const row of stuck) {
      const stamp = row.lastAttemptAt ?? row.createdAt;
      if (stamp && Date.now() - parseDbTime(stamp) > STUCK_PROCESSING_MS) {
        await db
          .update(emailQueue)
          .set({ status: "pending" })
          .where(eq(emailQueue.id, row.id));
        recovered += 1;
      }
    }
    return recovered;
  } catch (error) {
    console.error("Failed to recover stuck emails:", error);
    return 0;
  }
}

export async function getEmailQueueCounts(): Promise<{
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}> {
  const rows = await db
    .select({ status: emailQueue.status, count: sql<number>`count(*)` })
    .from(emailQueue)
    .groupBy(emailQueue.status);
  const counts = { pending: 0, processing: 0, sent: 0, failed: 0 };
  for (const row of rows) {
    if (row.status && row.status in counts) {
      counts[row.status as keyof typeof counts] = row.count;
    }
  }
  return counts;
}

export async function processEmailQueue(batchSize = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  await recoverStuckProcessingEmails();
  const claimedIds = await claimEmailsForProcessing(batchSize);

  if (claimedIds.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  const emails = await getEmailsByIds(claimedIds);
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      if (!resend) {
        await markEmailFailed(email.id, "RESEND_API_KEY not configured");
        failed += 1;
        continue;
      }

      const result = await resend.emails.send({
        from: EMAIL_FROM,
        to: email.toEmail,
        subject: email.subject,
        html: email.body,
      });

      if (result.error) {
        await markEmailFailed(email.id, result.error.message);
        failed += 1;
      } else {
        await markEmailSent(email.id);
        sent += 1;
      }
    } catch (error) {
      await markEmailFailed(email.id, String(error));
      failed += 1;
    }

    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
  }

  return {
    processed: emails.length,
    sent,
    failed,
  };
}

export async function cleanupProcessedEmails(daysToKeep = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffString = cutoffDate.toISOString();

    const result = await db
      .delete(emailQueue)
      .where(
        and(
          or(
            eq(emailQueue.status, "sent"),
            eq(emailQueue.status, "failed")
          ),
          lte(emailQueue.createdAt, cutoffString)
        )
      );

    return result.changes ?? 0;
  } catch (error) {
    console.error("Failed to cleanup emails:", error);
    return 0;
  }
}
