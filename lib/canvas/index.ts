import { db } from "@/lib/db";
import { templates } from "@/drizzle/schema";
import { eq, and, isNull, desc, sql, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { CanvasDocument, CanvasElement, ElementType } from "@/types/canvas";

// ============================================
// ELEMENT CREATION
// ============================================

const ELEMENT_NAMES: Record<string, string> = {
  text: "Text",
  image: "Image",
  shape: "Shape",
  list: "List",
  checklist: "Checklist",
  portal_checklist: "Checklist",
  proscons: "Pros/Cons",
  button: "Button",
  pdf: "PDF",
  divider: "Divider",
  portal_dates: "Dates",
  portal_notices: "Notices",
  portal_documents: "Documents",
  portal_faqs: "FAQ",
};

export function createElement(
  type: ElementType,
  existingCount: number,
  x = 150,
  y = 150
): CanvasElement {
  const base: CanvasElement = {
    id: nanoid(8),
    name: `${ELEMENT_NAMES[type] || "Element"} ${existingCount + 1}`,
    type,
    x,
    y,
    width: type === "text" ? 200 : 300,
    height: type === "text" ? 60 : 200,
    rotation: 0,
    zIndex: Date.now(),
    locked: false,
    visible: true,
  };

  switch (type) {
    case "text":
      return {
        ...base,
        text: "Double-click to edit",
        fontSize: 16,
        color: "#333333",
        fontFamily: "Inter",
        textAlign: "left",
        fontWeight: "normal",
      };
    case "image":
      return {
        ...base,
        assetId: null,
        objectFit: "cover",
        borderRadius: 0,
      };
    case "shape":
      return {
        ...base,
        shapeType: "square",
        fillColor: "#e8b84b",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 0,
        opacity: 1,
      };
    case "list":
      return {
        ...base,
        listType: "bullet",
        items: ["Item 1", "Item 2"],
        bulletStyle: "disc",
      };
    case "checklist":
      return {
        ...base,
        items: [
          { id: nanoid(6), text: "Task 1", checked: false },
          { id: nanoid(6), text: "Task 2", checked: false },
        ],
      };
    case "portal_checklist":
      return {
        ...base,
        items: [
          { id: nanoid(6), text: "Complete online check-in", checked: false },
          { id: nanoid(6), text: "Submit dietary needs", checked: false },
        ],
      };
    case "proscons":
      return {
        ...base,
        pros: ["Pro 1"],
        cons: ["Con 1"],
      };
    case "button":
      return {
        ...base,
        text: "Click Here",
        link: "#",
        backgroundColor: "#4a7c59",
        textColor: "#ffffff",
        borderRadius: 8,
      };
    case "pdf":
      return {
        ...base,
        assetId: null,
        displayMode: "thumbnail",
        fileName: "",
      };
    case "divider":
      return {
        ...base,
        height: 2,
        color: "#cccccc",
        thickness: 2,
      };
    case "portal_dates":
      return {
        ...base,
        height: 150,
        portalDatesData: {
          showDeparture: true,
          showReturn: true,
          showCountdown: true,
          label: "Trip Dates",
        },
      };
    case "portal_notices":
      return {
        ...base,
        height: 300,
        portalNoticesData: {
          maxItems: 5,
          showPinnedOnly: false,
          showGlobalAnnouncements: true,
          title: "Notices",
        },
      };
    case "portal_documents":
      return {
        ...base,
        height: 250,
        portalDocumentsData: {
          maxItems: 10,
          showFileType: true,
          title: "Documents",
        },
      };
    case "portal_faqs":
      return {
        ...base,
        height: 300,
        portalFaqsData: {
          maxItems: 10,
          title: "FAQs",
        },
      };
    default:
      return base;
  }
}

// ============================================
// TEMPLATE OPERATIONS (with ownership scoping)
// ============================================

export async function getAllTemplates(contentType: string, userId?: number) {
  const conditions = [
    eq(templates.contentType, contentType),
    isNull(templates.deletedAt),
  ];

  conditions.push(
    or(
      eq(templates.isBuiltIn, true),
      userId ? eq(templates.userId, userId) : sql`1 = 0`
    )
  );

  return db.select().from(templates)
    .where(and(...conditions))
    .orderBy(desc(templates.createdAt));
}

export async function getTemplateById(id: number, userId?: number) {
  const result = await db.select().from(templates)
    .where(and(eq(templates.id, id), isNull(templates.deletedAt)))
    .limit(1);
  const template = result[0];
  if (!template) return null;
  if (template.isBuiltIn) return template;
  if (userId && template.userId === userId) return template;
  return null;
}

export async function saveTemplate(data: {
  name: string;
  contentType: string;
  layoutData: string;
  userId: number;
}) {
  return db.insert(templates).values({
    name: data.name,
    contentType: data.contentType,
    layoutData: data.layoutData,
    isBuiltIn: false,
    userId: data.userId,
  }).returning();
}

export async function updateTemplate(
  id: number,
  userId: number,
  data: Partial<{ name: string; layoutData: string }>
) {
  const template = await db.select().from(templates)
    .where(and(eq(templates.id, id), isNull(templates.deletedAt)))
    .limit(1);
  if (template.length === 0) return null;
  if (template[0].isBuiltIn) return null;
  if (template[0].userId !== userId) return null;

  return db.update(templates)
    .set({
      ...data,
      updatedAt: new Date().toISOString(),
      version: sql`version + 1`,
    })
    .where(eq(templates.id, id))
    .returning();
}

export async function deleteTemplate(id: number, userId: number) {
  const template = await db.select().from(templates)
    .where(and(eq(templates.id, id), isNull(templates.deletedAt)))
    .limit(1);
  if (template.length === 0) return { error: "Not found" };
  if (template[0].isBuiltIn) return { error: "Cannot delete built-in template" };
  if (template[0].userId !== userId) return { error: "Not authorized" };

  await db.update(templates)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(templates.id, id));
  return { success: true };
}

export async function duplicateTemplate(id: number, userId: number, newName?: string) {
  const template = await db.select().from(templates)
    .where(and(eq(templates.id, id), isNull(templates.deletedAt)))
    .limit(1);
  if (template.length === 0) return null;

  const original = template[0];
  if (!original.isBuiltIn && original.userId !== userId) return null;

  return db.insert(templates).values({
    name: newName || `${original.name} Copy`,
    contentType: original.contentType,
    layoutData: original.layoutData,
    isBuiltIn: false,
    userId: userId,
    createdFromTemplateId: original.id,
  }).returning();
}

// ============================================
// DOCUMENT HELPERS
// ============================================

export function parseCanvasDocument(json: string): CanvasDocument | null {
  try {
    const doc = JSON.parse(json);
    
    // Validate basic structure
    if (typeof doc !== "object" || doc === null) return null;
    if (doc.schemaVersion !== 1) return null;
    if (!Array.isArray(doc.elements)) return null;
    if (typeof doc.canvas !== "object" || doc.canvas === null) return null;
    if (typeof doc.canvas.width !== "number" || typeof doc.canvas.height !== "number") return null;
    
    // Validate each element minimally
    for (const el of doc.elements) {
      if (!el.id || !el.type || typeof el.x !== "number" || typeof el.y !== "number") {
        return null;
      }
    }
    
    return doc as CanvasDocument;
  } catch {
    return null;
  }
}

export function serializeCanvasDocument(doc: CanvasDocument): string {
  return JSON.stringify(doc);
}

export function sortElementsByZIndex(elements: CanvasElement[]): CanvasElement[] {
  return [...elements].sort((a, b) => a.zIndex - b.zIndex);
}
