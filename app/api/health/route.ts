import { NextRequest, NextResponse } from "next/server";
import {
  checkDatabaseHealth,
  checkDiskSpace,
} from "@/lib/monitoring";

export async function GET(req: NextRequest) {
  try {
    const [dbHealth, diskHealth] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(checkDiskSpace()),
    ]);

    const isHealthy = dbHealth.healthy && diskHealth.healthy;

    if (isHealthy) {
      return NextResponse.json(
        { status: "ok" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { status: "degraded" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error" },
      { status: 500 }
    );
  }
}
