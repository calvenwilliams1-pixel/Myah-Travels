import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    featuredImage: text("featured_image"),
    status: text("status")
      .default("draft")
      .check(sql`status IN ('draft', 'published', 'hidden', 'scheduled')`),
    scheduledAt: text("scheduled_at"),
    publishedAt: text("published_at"),
    updatedAt: text("updated_at"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    deletedAt: text("deleted_at"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true),
  },
  (table) => ({
    idxPostsStatus: index("idx_posts_status").on(table.status),
    idxPostsPublishedAt: index("idx_posts_published_at").on(table.publishedAt),
    idxPostsDeletedAt: index("idx_posts_deleted_at").on(table.deletedAt),
    idxPostsStatusDeletedAt: index("idx_posts_status_deleted_at").on(table.status, table.deletedAt),
  })
);
