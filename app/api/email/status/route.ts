import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailQueue } from "@/drizzle/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [pendingResult, sentResult, failedResult, processingResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailQueue)
        .where(eq(emailQueue.status, "pending")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailQueue)
        .where(eq(emailQueue.status, "sent")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailQueue)
        .where(eq(emailQueue.status, "failed")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(emailQueue)
        .where(eq(emailQueue.status, "processing")),
    ]);

    return NextResponse.json({
      pending: pendingResult[0]?.count ?? 0,
      sent: sentResult[0]?.count ?? 0,
      failed: failedResult[0]?.count ?? 0,
      processing: processingResult[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Failed to get email status:", error);
    return NextResponse.json(
      { error: "Failed to get email status" },
      { status: 500 }
    );
  }
}
