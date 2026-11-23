import { randomBytes, createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/drizzle/schema";
import { hashPassword, revokeTrustedDevices, lucia } from "@/lib/auth";
import { queueEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";

// Forgot-password flow for admin accounts. Admin users have no email
// address on their record, so reset links are sent to the site's admin
// inbox (EMAIL_ADMIN_TO) — the account holder's own mailbox in this
// single-admin deployment. The token pattern mirrors trusted devices:
// the DB stores only the SHA-256 hash; the raw token lives only in the
// emailed link. Links expire after 1 hour and are single-use.
const RESET_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Start a reset for the named account. Resolves silently in every case —
 * unknown, inactive, or deleted accounts and a missing admin inbox all
 * look identical to the caller, so the form can't be used to probe which
 * usernames exist.
 */
export async function requestPasswordReset(username: string): Promise<void> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);
  const user = rows[0];
  if (!user || !user.isActive || user.deletedAt) return;

  const adminEmail = process.env.EMAIL_ADMIN_TO;
  if (!adminEmail) {
    console.error("Password reset requested but EMAIL_ADMIN_TO is not set");
    return;
  }

  // One live link per account: a new request kills the previous links.
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, user.id));

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await db.insert(passwordResetTokens).values({
    id: hashResetToken(token),
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
  });

  const siteUrl = process.env.SITE_URL || "http://localhost:3000";
  const resetUrl = `${siteUrl}/admin/reset-password?token=${token}`;
  const email = passwordResetEmail(user.username, resetUrl);
  await queueEmail({
    toEmail: adminEmail,
    subject: email.subject,
    body: email.html,
  });
}

/**
 * Resolve a raw reset token to its user id, or null when the token is
 * unknown or expired (expired rows are deleted on sight). Does not
 * consume the token — the reset page uses this to decide whether to
 * show the form.
 */
export async function getPasswordResetUserId(
  token: string
): Promise<number | null> {
  if (!token) return null;
  const id = hashResetToken(token);
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expiresAt) < new Date()) {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, id));
    return null;
  }
  return row.userId;
}

/**
 * Complete a reset: set the new password, clear any forced-change flag,
 * burn every outstanding reset token for the account, revoke trusted
 * devices, and end all existing sessions. Returns false when the token
 * is no longer valid.
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  const userId = await getPasswordResetUserId(token);
  if (userId === null) return false;

  const newHash = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: newHash, mustChangePassword: false })
    .where(eq(users.id, userId));

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
  await revokeTrustedDevices(userId);
  await lucia.invalidateUserSessions(userId.toString());
  return true;
}

/** Burn any outstanding reset links for a user (e.g. after a password change). */
export async function revokePasswordResetTokens(userId: number): Promise<void> {
  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
}
