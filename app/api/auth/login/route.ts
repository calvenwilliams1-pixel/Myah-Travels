import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { verifyPassword, createSession, createPendingTotp } from "@/lib/auth";
import { logActivity } from "@/lib/logging";
import { loginRateLimit, getClientIp } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const userAgent = headersList.get("user-agent") || "unknown";

    // Rate limit
    const rateLimitResult = loginRateLimit(ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 400 });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user.length === 0) {
      await logActivity({
        userId: null,
        actionType: "login_failed",
        entityType: "user",
        details: "User not found",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const foundUser = user[0];

    // Disabled account
    if (!foundUser.isActive) {
      await logActivity({
        userId: foundUser.id,
        actionType: "login_failed",
        entityType: "user",
        entityId: foundUser.id,
        details: "Account disabled",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ error: "This account has been disabled." }, { status: 403 });
    }

    const passwordValid = await verifyPassword(password, foundUser.passwordHash);

    if (!passwordValid) {
      await logActivity({
        userId: foundUser.id,
        actionType: "login_failed",
        entityType: "user",
        entityId: foundUser.id,
        details: "Invalid password",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    // TOTP: a correct password alone is not a login for enrolled users.
    // Park the attempt in a pending state; /api/auth/verify-totp creates
    // the session once the code checks out.
    if (foundUser.totpEnabled && foundUser.totpSecret) {
      await createPendingTotp(foundUser.id);
      await logActivity({
        userId: foundUser.id,
        actionType: "login_totp_pending",
        entityType: "user",
        entityId: foundUser.id,
        details: "Password accepted — awaiting TOTP verification",
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ success: true, requiresTotp: true });
    }

    // Create session
    await createSession(foundUser.id);

    await logActivity({
      userId: foundUser.id,
      actionType: "login_success",
      entityType: "user",
      entityId: foundUser.id,
      details: "Login successful",
      ipAddress: ip,
      userAgent,
    });

    // Signal setup required if onboarding is incomplete
    const requiresSetup =
      !!foundUser.mustChangePassword || !foundUser.hasCompletedSetup;

    return NextResponse.json({
      success: true,
      requiresSetup,
    });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
