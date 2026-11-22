import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email";
import {
  cleanupExpiredMagicLinks,
  cleanupExpiredPortalSessions,
  cleanupProcessedEmails,
} from "@/lib/jobs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processEmailQueue(50);

    // Housekeeping that previously had no caller anywhere: expired magic
    // links and portal sessions, plus processed-email retention. Runs on
    // the cron's coattails; best-effort — a cleanup failure must never
    // mask the email result.
    try {
      await cleanupExpiredMagicLinks();
      await cleanupExpiredPortalSessions();
      await cleanupProcessedEmails(30);
    } catch (cleanupError) {
      console.error("Cron cleanup failed:", cleanupError);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Queue processing failed:", error);
    return NextResponse.json(
      { error: "Queue processing failed" },
      { status: 500 }
    );
  }
}
