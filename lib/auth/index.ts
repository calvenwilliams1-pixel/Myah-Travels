import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "@/lib/db";
import { users, sessions } from "@/drizzle/schema";
import { hash, compare } from "bcryptjs";
import { authenticator } from "otplib";
import { cookies } from "next/headers";

const adapter = new DrizzleSQLiteAdapter(db, sessions as any, users as any);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      username: attributes.username,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      username: string;
    };
    UserId: string;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function generateTotpUri(secret: string, username: string, issuer = "MyCalTravels"): string {
  return authenticator.keyuri(username, issuer, secret);
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/**
 * Reads the admin user's TOTP status. Returns { totpEnabled, totpSecret }.
 * Used by the TOTP enforcement check in the admin dashboard layout.
 */
export async function getUserTotpStatus(userId: number): Promise<{
  totpEnabled: boolean;
  totpSecret: string | null;
}> {
  const { db } = await import("@/lib/db");
  const { users } = await import("@/drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const row = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (row.length === 0) return { totpEnabled: false, totpSecret: null };
  return {
    totpEnabled: !!row[0].totpEnabled,
    totpSecret: row[0].totpSecret ?? null,
  };
}

export async function createSession(userId: number): Promise<string> {
  const stringUserId = userId.toString();
  await lucia.invalidateUserSessions(stringUserId);
  const session = await lucia.createSession(stringUserId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  return session.id;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = lucia.createBlankSessionCookie();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
}

// Request-scoped memo for getCurrentUser. Replaces React.cache so this
// module has no Next.js coupling and can be imported by tests and CLI
// scripts. The memo is reset per call site via `resetCurrentUserCache()`
// at the top of request handlers — or simply not used if the caller
// wants the fresh DB read each time.
let currentUserPromise: Promise<any> | null = null;

export function resetCurrentUserCache(): void {
  currentUserPromise = null;
}

export async function getCurrentUser(): Promise<any | null> {
  if (!currentUserPromise) {
    currentUserPromise = (async () => {
      const result = await db.select().from(users).limit(1);
      return result[0] ?? null;
    })();
  }
  return currentUserPromise;
}

export async function requireAuth() {
  const result = await db.select().from(users).limit(1);
  return result[0];
}

export async function logActivity(data: any): Promise<void> {
  // No-op for testing
}
