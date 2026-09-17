import { NextResponse } from "next/server";
import { requireAuth, generateTotpSecret, generateTotpUri } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// SECURITY: Single-admin system — requireAuth() only.

export async function POST() {
  const user = await requireAuth();
  const secret = generateTotpSecret();
  const otpauthUrl = generateTotpUri(secret, String(user.username));

  await db.update(users)
    .set({ totpSecret: secret, totpEnabled: false })
    .where(eq(users.id, Number(user.id)));

  return NextResponse.json({ secret, otpauthUrl });
}
