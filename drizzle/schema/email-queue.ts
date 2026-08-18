import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const emailQueue = sqliteTable(
  "email_queue",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    status: text("status").default("pending"),
    attempts: integer("attempts").default(0),
    lastAttemptAt: text("last_attempt_at"),
    errorMessage: text("error_message"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    sentAt: text("sent_at"),
  },
  (table) => ({
    idxEmailQueueStatusCreatedAt: index("idx_email_queue_status_created_at").on(table.status, table.createdAt),
  })
);
