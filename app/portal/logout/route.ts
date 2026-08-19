import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroyPortalSession } from "@/lib/portal";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("portal_session")?.value;

  try {
    if (sessionId) {
      await destroyPortalSession(sessionId);
    }
  } finally {
    cookieStore.delete("portal_session");
  }

  return NextResponse.redirect(new URL("/", req.url));
}
