import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { categories } from "./categories";

export const videos = sqliteTable(
  "videos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    youtubeUrl: text("youtube_url").notNull(),
    youtubeId: text("youtube_id").notNull().unique(),
    title: text("title"),
    description: text("description"),
    thumbnailUrl: text("thumbnail_url"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
    status: text("status").default("published"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
  },
  (table) => ({
    idxVideosCategoryId: index("idx_videos_category_id").on(table.categoryId),
    idxVideosStatus: index("idx_videos_status").on(table.status),
    idxVideosDeletedAt: index("idx_videos_deleted_at").on(table.deletedAt),
  })
);
