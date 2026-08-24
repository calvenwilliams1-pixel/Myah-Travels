// ============================================
// CANVAS DESIGN SYSTEM TYPES
// ============================================

export interface CanvasDocument {
  schemaVersion: number;
  templateVersion?: number;
  createdFromTemplateId?: number;
  canvas: {
    width: number;
    height: number;
    background: string | null;
  };
  theme?: {
    primaryColor: string;
    secondaryColor: string;
    headingFont: string;
    bodyFont: string;
  };
  elements: CanvasElement[];
}

export interface CanvasElement {
  id: string;
  name: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  portalDatesData?: PortalDatesData;
  portalNoticesData?: PortalNoticesData;
  portalDocumentsData?: PortalDocumentsData;
  portalFaqsData?: PortalFaqsData;
  groupId?: string;
  [key: string]: any;
}

export type ElementType = 
  | "text"
  | "image"
  | "shape"
  | "list"
  | "checklist"
  | "portal_checklist"
  | "proscons"
  | "button"
  | "pdf"
  | "portal_dates"
  | "portal_notices"
  | "portal_documents"
  | "portal_faqs"
  | "divider"
  | "portal_dates"
  | "portal_notices"
  | "portal_documents"
  | "portal_faqs";

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export const DEFAULT_CANVAS_SIZES: Record<string, { width: number; height: number }> = {
  review: { width: 800, height: 1200 },
  guide: { width: 800, height: 1400 },
  homepage: { width: 800, height: 2000 },
  portal: { width: 800, height: 1200 },
  canvas_block: { width: 800, height: 600 },
};

export const DEFAULT_THEME = {
  primaryColor: "#4a7c59",
  secondaryColor: "#e8b84b",
  headingFont: "Inter",
  bodyFont: "Inter",
};

export function createEmptyCanvas(
  contentType: string = "review"
): CanvasDocument {
  const size = DEFAULT_CANVAS_SIZES[contentType] || DEFAULT_CANVAS_SIZES.review;
  
  return {
    schemaVersion: 1,
    canvas: {
      width: size.width,
      height: size.height,
      background: "#ffffff",
    },
    theme: { ...DEFAULT_THEME },
    elements: [],
  };
}

export interface PortalDatesData {
  showDeparture: boolean;
  showReturn: boolean;
  showCountdown: boolean;
  label: string;
}

export interface PortalNoticesData {
  maxItems: number;
  showPinnedOnly: boolean;
  showGlobalAnnouncements: boolean;
  title: string;
}

export interface PortalDocumentsData {
  maxItems: number;
  showFileType: boolean;
  title: string;
}

export interface PortalFaqsData {
  maxItems: number;
  title: string;
}

export interface PortalRuntimeData {
  departureDate?: string;
  returnDate?: string;
  notices?: Array<{
    id: number;
    title: string;
    content: string;
    isPinned: boolean;
    isGlobalAnnouncement: boolean;
    createdAt: string;
  }>;
  documents?: Array<{
    id: number;
    title: string;
    fileType: string;
    fileUrl: string;
  }>;
  faqs?: Array<{
    id: number;
    question: string;
    answer: string;
  }>;
}
