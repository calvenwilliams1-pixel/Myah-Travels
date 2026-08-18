import { db } from "@/lib/db";
import { activityLog } from "@/drizzle/schema";
import { desc, eq, and, gte, lte, like, sql } from "drizzle-orm";

// ============================================
// ACTIVITY LOGGING UTILITIES
// ============================================

export interface LogActivityInput {
  userId?: number | null;
  actionType: string;
  entityType: string;
  entityId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await db.insert(activityLog).values({
      userId: input.userId ?? null,
      actionType: input.actionType,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      details: input.details ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getRecentActivity(limit = 50) {
  try {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  } catch (error) {
    console.error("Failed to fetch activity:", error);
    return [];
  }
}

export async function getActivityByEntity(
  entityType: string,
  entityId: number
) {
  try {
    return await db
      .select()
      .from(activityLog)
      .where(
        and(
          eq(activityLog.entityType, entityType),
          eq(activityLog.entityId, entityId)
        )
      )
      .orderBy(desc(activityLog.createdAt));
  } catch (error) {
    console.error("Failed to fetch entity activity:", error);
    return [];
  }
}

export async function getActivityByUser(userId: number) {
  try {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt));
  } catch (error) {
    console.error("Failed to fetch user activity:", error);
    return [];
  }
}

export async function getActivityByDateRange(
  startDate: string,
  endDate: string
) {
  try {
    return await db
      .select()
      .from(activityLog)
      .where(
        and(
          gte(activityLog.createdAt, startDate),
          lte(activityLog.createdAt, endDate)
        )
      )
      .orderBy(desc(activityLog.createdAt));
  } catch (error) {
    console.error("Failed to fetch activity by date:", error);
    return [];
  }
}

export async function getActivityByAction(actionType: string) {
  try {
    return await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.actionType, actionType))
      .orderBy(desc(activityLog.createdAt));
  } catch (error) {
    console.error("Failed to fetch activity by action:", error);
    return [];
  }
}

export async function searchActivity(query: string) {
  try {
    return await db
      .select()
      .from(activityLog)
      .where(like(activityLog.details, `%${query}%`))
      .orderBy(desc(activityLog.createdAt))
      .limit(100);
  } catch (error) {
    console.error("Failed to search activity:", error);
    return [];
  }
}

export async function cleanupOldActivity(daysToKeep = 365) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await db
      .delete(activityLog)
      .where(lte(activityLog.createdAt, cutoffDate.toISOString()));

    return { success: true, deletedBefore: cutoffDate.toISOString() };
  } catch (error) {
    console.error("Failed to cleanup activity:", error);
    return { success: false, error: String(error) };
  }
}

export async function countActivity(): Promise<number> {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(activityLog);
    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Failed to count activity:", error);
    return 0;
  }
}
