import { z } from "zod";

const CONTENT_TYPES = ["pdf", "image", "text"] as const;
const CATEGORIES = ["guide", "checklist", "faq", "alert", "document", "other"] as const;

export const AddLibraryItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(CONTENT_TYPES),
  category: z.enum(CATEGORIES).optional(),
  filePath: z.string().optional(),
  textContent: z.string().optional(),
});

export const AttachLibraryItemSchema = z.object({
  contentLibraryId: z.number(),
});

export const AddPortalSpecificItemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  type: z.enum(CONTENT_TYPES),
  category: z.enum(CATEGORIES).optional(),
  filePath: z.string().optional(),
  textContent: z.string().optional(),
});

export const ReorderItemsSchema = z.object({
  orderedIds: z.array(z.number()),
});
