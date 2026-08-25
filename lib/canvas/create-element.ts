import { nanoid } from "nanoid";
import { CanvasElement, ElementType } from "@/types/canvas";

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
      return { ...base, text: "Double-click to edit", richText: "", fontSize: 16, color: "#333333", fontFamily: "Inter", textAlign: "left", fontWeight: "normal" };
    case "image":
      return { ...base, assetId: null, objectFit: "cover", borderRadius: 0 };
    case "shape":
      return { ...base, shapeType: "square", fillColor: "#e8b84b", borderColor: "transparent", borderWidth: 0, borderRadius: 0, opacity: 1 };
    case "list":
      return { ...base, listType: "bullet", items: ["Item 1", "Item 2"], bulletStyle: "disc" };
    case "checklist":
      return { ...base, items: [{ id: nanoid(6), text: "Task 1", checked: false }, { id: nanoid(6), text: "Task 2", checked: false }] };
    case "portal_checklist":
      return { ...base, items: [{ id: nanoid(6), text: "Complete online check-in", checked: false }, { id: nanoid(6), text: "Submit dietary needs", checked: false }] };
    case "proscons":
      return { ...base, pros: ["Pro 1"], cons: ["Con 1"] };
    case "button":
      return { ...base, text: "Click Here", link: "#", backgroundColor: "#4a7c59", textColor: "#ffffff", borderRadius: 8 };
    case "pdf":
      return { ...base, assetId: null, displayMode: "thumbnail", fileName: "" };
    case "divider":
      return { ...base, height: 2, color: "#cccccc", thickness: 2 };
    case "portal_dates":
      return { ...base, height: 150, portalDatesData: { showDeparture: true, showReturn: true, showCountdown: true, label: "Trip Dates" } };
    case "portal_notices":
      return { ...base, height: 300, portalNoticesData: { maxItems: 5, showPinnedOnly: false, showGlobalAnnouncements: true, title: "Notices" } };
    case "portal_documents":
      return { ...base, height: 250, portalDocumentsData: { maxItems: 10, showFileType: true, title: "Documents" } };
    case "portal_faqs":
      return { ...base, height: 300, portalFaqsData: { maxItems: 10, title: "FAQs" } };
    default:
      return base;
  }
}

export function getNextZIndex(elements: CanvasElement[]): number {
  if (elements.length === 0) return 1;
  const maxZ = Math.max(...elements.map((el) => el.zIndex || 0));
  return maxZ + 1;
}
