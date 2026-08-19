import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";
import os from "os";

// ============================================
// MONITORING UTILITIES
// ============================================

export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  error?: string;
}> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(sql`users`);

    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: String(error) };
  }
}

export function checkDiskSpace(): {
  healthy: boolean;
  usagePercent: number;
} {
  try {
    const stats = fs.statfsSync("/");
    const total = stats.blocks * stats.bsize;
    const free = stats.bavail * stats.bsize;
    const usagePercent = Math.round(((total - free) / total) * 100);

    return {
      healthy: usagePercent < 90,
      usagePercent,
    };
  } catch (error) {
    return {
      healthy: false,
      usagePercent: 100,
    };
  }
}

export function getSystemUptime(): string {
  const uptimeSeconds = os.uptime();
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

export function getLatestBackupInfo(): {
  exists: boolean;
  ageDays?: number;
} {
  try {
    const backupDir = "/backups/db";
    if (!fs.existsSync(backupDir)) {
      return { exists: false };
    }

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".db"));
    if (files.length === 0) {
      return { exists: false };
    }

    files.sort().reverse();
    const latest = files[0];
    const fullPath = path.join(backupDir, latest);
    const stats = fs.statSync(fullPath);
    const ageDays = Math.floor((Date.now() - stats.mtimeMs) / 86400000);

    return { exists: true, ageDays };
  } catch (error) {
    return { exists: false };
  }
}
