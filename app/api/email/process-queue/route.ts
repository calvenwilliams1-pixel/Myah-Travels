import { NextRequest, NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processEmailQueue(50);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Queue processing failed:", error);
    return NextResponse.json(
      { error: "Queue processing failed" },
      { status: 500 }
    );
  }
}
