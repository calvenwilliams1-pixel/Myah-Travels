import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, passwordResetTokens, trustedDevices, emailQueue } from "@/drizzle/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import {
  requestPasswordReset,
  getPasswordResetUserId,
  resetPasswordWithToken,
} from "./password-reset";

// Runs against the local dev DB, same pattern as lib/tags/aliases.test.ts:
// a unique fixture user per run, cleaned up afterwards.
const runId = Date.now().toString(36);
const USERNAME = `pwreset-${runId}`;
const ADMIN_EMAIL = `pwreset-admin-${runId}@example.test`;
let userId = 0;

process.env.EMAIL_ADMIN_TO = ADMIN_EMAIL;
process.env.SITE_URL = "http://test.local";

async function latestResetTokenFromEmail(): Promise<string | null> {
  const rows = await db
    .select()
    .from(emailQueue)
    .where(eq(emailQueue.toEmail, ADMIN_EMAIL));
  const row = rows[rows.length - 1];
  if (!row) return null;
  const match = row.body.match(/reset-password\?token=([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

async function tokenRows() {
  return db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId));
}

beforeAll(async () => {
  const [row] = await db
    .insert(users)
    .values({
      username: USERNAME,
      passwordHash: await hashPassword("old-password-1"),
      mustChangePassword: true,
      isActive: true,
    })
    .returning();
  userId = row.id;
});

afterAll(async () => {
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db.delete(trustedDevices).where(eq(trustedDevices.userId, userId));
  await db.delete(emailQueue).where(eq(emailQueue.toEmail, ADMIN_EMAIL));
  await db.delete(users).where(eq(users.id, userId));
});

describe("requestPasswordReset", () => {
  it("emails a link and stores only the token hash", async () => {
    await requestPasswordReset(USERNAME);
    const token = await latestResetTokenFromEmail();
    expect(token).toBeTruthy();

    const rows = await tokenRows();
    expect(rows).toHaveLength(1);
    // The stored id is the SHA-256 of the emailed token, never the token.
    expect(rows[0].id).toBe(
      createHash("sha256").update(token!).digest("hex")
    );
    expect(rows[0].id).not.toBe(token);
    expect(new Date(rows[0].expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("is silent for an unknown username", async () => {
    const before = (await tokenRows()).length;
    await requestPasswordReset(`nobody-${runId}`);
    expect((await tokenRows()).length).toBe(before);
  });

  it("a second request invalidates the first link", async () => {
    const first = await latestResetTokenFromEmail();
    await requestPasswordReset(USERNAME);
    const second = await latestResetTokenFromEmail();
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
    expect(await getPasswordResetUserId(first!)).toBeNull();
    expect(await getPasswordResetUserId(second!)).toBe(userId);
  });
});

describe("getPasswordResetUserId", () => {
  it("rejects garbage and expired tokens", async () => {
    expect(await getPasswordResetUserId("not-a-real-token")).toBeNull();
    expect(await getPasswordResetUserId("")).toBeNull();

    const expiredToken = `expired-${runId}`;
    await db.insert(passwordResetTokens).values({
      id: createHash("sha256").update(expiredToken).digest("hex"),
      userId,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    expect(await getPasswordResetUserId(expiredToken)).toBeNull();
    // Expired rows are deleted on sight.
    const rows = await tokenRows();
    expect(rows.some((r) => r.expiresAt < new Date().toISOString())).toBe(false);
  });
});

describe("resetPasswordWithToken", () => {
  it("sets the new password, clears the forced-change flag, and burns the token", async () => {
    await requestPasswordReset(USERNAME);
    const token = await latestResetTokenFromEmail();
    expect(token).toBeTruthy();

    // A trusted device exists to be revoked by the reset.
    await db.insert(trustedDevices).values({
      id: `device-${runId}`,
      userId,
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(await resetPasswordWithToken(token!, "brand-new-password")).toBe(true);

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    expect(await verifyPassword("brand-new-password", user.passwordHash)).toBe(true);
    expect(user.mustChangePassword).toBe(false);

    // Single-use: the same link cannot reset again, and no tokens remain.
    expect(await resetPasswordWithToken(token!, "another-password")).toBe(false);
    expect(await tokenRows()).toHaveLength(0);

    const devices = await db
      .select()
      .from(trustedDevices)
      .where(eq(trustedDevices.userId, userId));
    expect(devices).toHaveLength(0);
  });
});
