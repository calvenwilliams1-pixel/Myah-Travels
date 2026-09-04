import { Resend } from "resend";
import { db } from "@/lib/db";
import { emailQueue, emailSuppressions } from "@/drizzle/schema";
import { eq, and, or, lte, asc, inArray } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const pending = await getPendingEmails(limit);
    const ids = pending.map((e) => e.id);

    if (ids.length === 0) return [];

    await db
      .update(emailQueue)
      .set({ status: "processing" })
      .where(inArray(emailQueue.id, ids));

    return ids;
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

export async function processEmailQueue(batchSize = 50): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const claimedIds = await claimEmailsForProcessing(batchSize);

  if (claimedIds.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  const emails = await getEmailsByIds(claimedIds);
  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
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
