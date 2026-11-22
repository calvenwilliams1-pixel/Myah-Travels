import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  verifyTotp,
  createSession,
  readPendingTotp,
  failPendingTotp,
  clearPendingTotp,
} from "@/lib/auth";
import { logActivity } from "@/lib/logging";
import { getClientIp } from "@/lib/security";

// Completes a login that passed the password check for a TOTP-enabled user.
// The pending state (httpOnly cookie + server-side record) is created by
// POST /api/auth/login; a real session is only created here, after the code
// verifies. Pending logins expire after 5 minutes or 5 wrong codes.
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const userAgent = headersList.get("user-agent") || "unknown";

    const pending = await readPendingTotp();
    if (!pending) {
      return NextResponse.json(
        { error: "Your sign-in session expired. Please log in again." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || "").trim();
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Enter the 6-digit code from your authenticator app." },
        { status: 400 }
      );
    }

    const row = await db
      .select()
      .from(users)
      .where(eq(users.id, pending.userId))
      .limit(1);

    if (
      row.length === 0 ||
      !row[0].totpEnabled ||
      !row[0].totpSecret ||
      !row[0].isActive
    ) {
      await clearPendingTotp();
      return NextResponse.json(
        { error: "Your sign-in session expired. Please log in again." },
        { status: 401 }
      );
    }

    const user = row[0];
    const valid = verifyTotp(code, user.totpSecret as string);

    if (!valid) {
      const stillPending = await failPendingTotp(pending.token);
      await logActivity({
        userId: user.id,
        actionType: "login_failed",
        entityType: "user",
        entityId: user.id,
        details: "Invalid TOTP code",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json(
        {
          error: stillPending
            ? "That code didn't match. Try again."
            : "Too many incorrect codes. Please log in again.",
        },
        { status: 401 }
      );
    }

    await clearPendingTotp();
    await createSession(user.id);

    await logActivity({
      userId: user.id,
      actionType: "login_success",
      entityType: "user",
      entityId: user.id,
      details: "Login successful (TOTP verified)",
      ipAddress: ip,
      userAgent,
    });

    const requiresSetup = !!user.mustChangePassword || !user.hasCompletedSetup;

    return NextResponse.json({ success: true, requiresSetup });
  } catch (err) {
    console.error("Verify TOTP API error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
