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
/**
 * Kept for API compatibility. No-op — getCurrentUser no longer caches.
 * The previous module-level cache was process-scoped, not request-scoped,
 * and caused stale user reads across sessions (a login could show another
 * user's dashboard until the process restarted). Removed in Batch M.5d.
 */
export function resetCurrentUserCache(): void {
  // intentionally empty
}

/**
 * Read the currently authenticated user from the Lucia session.
 * Returns null if no session exists.
 * Reads fresh from the DB on every call — no caching. Correctness over
 * one extra query per request.
 */
export async function getCurrentUser(): Promise<any | null> {
  const authDisabled =
    process.env.DISABLE_AUTH === "true" && process.env.NODE_ENV !== "production";

  if (authDisabled) {
    const result = await db.select().from(users).limit(1);
    return result[0] ?? null;
  }

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(lucia.sessionCookieName);
    if (!sessionCookie?.value) return null;

    const { session, user } = await lucia.validateSession(sessionCookie.value);
    if (!session) return null;
    if (!user) return null;

    const { eq } = await import("drizzle-orm");
    const userId = parseInt(user.id, 10);
    const row = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const found = row[0] ?? null;
    if (found && !found.isActive) return null;
    return found;
  } catch {
    return null;
  }
}

/**
 * Typed auth error. API routes map `status` to the HTTP response code;
 * pages should let it bubble to the error boundary or redirect handler.
 */
export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require a valid session (and is_active). Does NOT require setup completion.
 * Used by the setup wizard and enroll-2fa routes — anything a pre-setup user
 * needs to reach.
 */
/**
 * Setup-completion guard. Extracted from `requireAuth` so it can be tested
 * without touching the database. Throws AuthError(403) when the user has not
 * finished onboarding or still owes a password change.
 */
export function checkSetupRequired(user: {
  hasCompletedSetup: boolean;
  mustChangePassword: boolean;
}): void {
  if (!user.hasCompletedSetup || user.mustChangePassword) {
    throw new AuthError(403, "Setup required");
  }
}

/**
 * Require a valid session (and is_active). Does NOT require setup completion.
 * Used by the setup wizard and enroll-2fa routes — anything a pre-setup user
 * needs to reach.
 */
export async function requireSession() {
  resetCurrentUserCache();
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Unauthorized");
  return user;
}

/**
 * Strict authentication gate. Requires:
 *   - Valid session
 *   - is_active = 1
 *   - has_completed_setup = 1
 *   - must_change_password = 0
 *
 * Throws AuthError on any failure. Use for all admin pages, admin actions,
 * and admin API routes.
 *
 * Dev bypass: DISABLE_AUTH=true in .env (ignored in production builds).
 * In production, the bypass is disabled and a valid Lucia session is required.
 */
export async function requireAuth() {
  resetCurrentUserCache();
  const user = await getCurrentUser();
  if (!user) throw new AuthError(401, "Unauthorized");
  checkSetupRequired(user);
  return user;
}

/**
 * Strict gate + return onboarding flags and isAdmin alongside the user.
 */
export async function requireAuthWithFlags(): Promise<{
  user: any;
  mustChangePassword: boolean;
  hasCompletedSetup: boolean;
  isActive: boolean;
  isAdmin: boolean;
}> {
  const user = await requireAuth();
  return {
    user,
    mustChangePassword: !!user.mustChangePassword,
    hasCompletedSetup: !!user.hasCompletedSetup,
    isActive: !!user.isActive,
    isAdmin: !!user.isAdmin,
  };
}

/**
 * Strict gate + admin role required. Use for /admin/users actions.
 */
export async function requireAdmin() {
  const flags = await requireAuthWithFlags();
  if (!flags.isAdmin) throw new AuthError(403, "Forbidden");
  return flags;
}

export async function logActivity(data: any): Promise<void> {
  // No-op for testing
}
