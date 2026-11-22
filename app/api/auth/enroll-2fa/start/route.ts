import { NextResponse } from "next/server";
import { AuthError, requireSession, generateTotpSecret, generateTotpUri } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// SECURITY: Single-admin system — requireSession() only.

export async function POST() { try {
  const user = await requireSession();
  const secret = generateTotpSecret();
  const otpauthUrl = generateTotpUri(secret, String(user.username));

  await db.update(users)
    .set({ totpSecret: secret, totpEnabled: false })
    .where(eq(users.id, Number(user.id)));

  return NextResponse.json({ secret, otpauthUrl });
 } catch (e) { if (e instanceof AuthError) { return NextResponse.json({ error: e.message }, { status: e.status }); } throw e; } }
