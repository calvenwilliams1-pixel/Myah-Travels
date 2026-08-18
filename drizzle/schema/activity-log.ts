import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const activityLog = sqliteTable(
  "activity_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id"),
    actionType: text("action_type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: integer("entity_id"),
    details: text("details"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    idxActivityLogCreatedAt: index("idx_activity_log_created_at").on(table.createdAt),
    idxActivityLogEntity: index("idx_activity_log_entity").on(table.entityType, table.entityId),
    idxActivityLogAction: index("idx_activity_log_action").on(table.actionType),
    idxActivityLogUserId: index("idx_activity_log_user_id").on(table.userId),
  })
);
