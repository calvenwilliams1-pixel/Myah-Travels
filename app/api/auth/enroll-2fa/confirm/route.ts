import { NextRequest, NextResponse } from "next/server";
import { requireAuth, verifyTotp } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// SECURITY: Single-admin system — requireAuth() only.

export async function POST(req: NextRequest) {
  const user = await requireAuth();
  const body = await req.json();
  const code = String(body?.code || "").trim();

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const row = await db.select().from(users).where(eq(users.id, Number(user.id))).limit(1);
  if (row.length === 0 || !row[0].totpSecret) {
    return NextResponse.json({ error: "No enrollment in progress" }, { status: 400 });
  }

  const valid = verifyTotp(code, row[0].totpSecret);
  if (!valid) {
    return NextResponse.json({ error: "Code did not match" }, { status: 400 });
  }

  await db.update(users)
    .set({ totpEnabled: true })
    .where(eq(users.id, Number(user.id)));

  return NextResponse.json({ success: true });
}
