import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    const foundUser = user[0];
    const passwordValid = await verifyPassword(password, foundUser.passwordHash);

    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
    }

    await createSession(foundUser.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
