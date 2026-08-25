import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const guides = sqliteTable(
  "guides",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    featuredImage: text("featured_image"),
    headerImage: text("header_image"),
    quickReference: text("quick_reference"),
    status: text("status").default("draft"),
    scheduledAt: text("scheduled_at"),
    publishedAt: text("published_at"),
    updatedAt: text("updated_at"),
    createdAt: text("created_at"),
    expiresAt: text("expires_at"),
    isExpired: integer("is_expired", { mode: "boolean" }).default(false),
    deletedAt: text("deleted_at"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    isVisible: integer("is_visible", { mode: "boolean" }).default(true),
    isPinned: integer("is_pinned", { mode: "boolean" }).default(false),
    isHighlighted: integer("is_highlighted", { mode: "boolean" }).default(false),
    pinnedAt: text("pinned_at"),
    mode: text("mode", { enum: ["story", "design"] }).default("story"),
  },
  (table) => ({
    idxGuidesStatus: index("idx_guides_status").on(table.status),
    idxGuidesPublishedAt: index("idx_guides_published_at").on(table.publishedAt),
    idxGuidesDeletedAt: index("idx_guides_deleted_at").on(table.deletedAt),
    idxGuidesStatusDeletedAt: index("idx_guides_status_deleted_at").on(table.status, table.deletedAt),
  })
);
