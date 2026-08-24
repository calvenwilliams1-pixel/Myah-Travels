import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const posts = sqliteTable(
  "posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    featuredImage: text("featured_image"),
    status: text("status").default("draft"),
    scheduledAt: text("scheduled_at"),
    publishedAt: text("published_at"),
    updatedAt: text("updated_at"),
    createdAt: text("created_at"),
    deletedAt: text("deleted_at"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true),
    isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
    isHighlighted: integer("is_highlighted", { mode: "boolean" }).default(false),
    pinnedAt: text("pinned_at"),
  },
  (table) => ({
    idxPostsStatus: index("idx_posts_status").on(table.status),
    idxPostsPublishedAt: index("idx_posts_published_at").on(table.publishedAt),
    idxPostsDeletedAt: index("idx_posts_deleted_at").on(table.deletedAt),
    idxPostsStatusDeletedAt: index("idx_posts_status_deleted_at").on(table.status, table.deletedAt),
  })
);
