import { z } from "zod";

const SEGMENT_TYPES = ["activity", "travel", "meal", "free_day"] as const;

export const CreateItinerarySchema = z.object({
  portalId: z.number(),
  title: z.string().min(1, "Title is required"),
});

export const UpdateItinerarySchema = z.object({
  title: z.string().min(1).optional(),
  themePreset: z.string().nullable().optional(),
});

export const CreateSectionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  baseCity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: "End date must be after start date" }
);

export const CreateDaySchema = z.object({
  date: z.string().min(1, "Date is required"),
  dayNumber: z.number(),
  title: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateSegmentSchema = z.object({
  type: z.enum(SEGMENT_TYPES),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  location: z.string().optional(),
  instructions: z.string().optional(),
  confirmation: z.string().optional(),
  referenceType: z.enum(["record_locator", "booking_number", "confirmation", "other"]).optional(),
  referenceLabel: z.string().optional(),
  departureAirport: z.string().optional(),
  arrivalAirport: z.string().optional(),
  departureDatetime: z.string().optional(),
  arrivalDatetime: z.string().optional(),
  airline: z.string().optional(),
  flightNumber: z.string().optional(),
})
.refine(
  (data) => {
    if (data.type !== "travel") {
      const hasFlightFields = data.departureAirport || data.arrivalAirport ||
        data.departureDatetime || data.arrivalDatetime ||
        data.airline || data.flightNumber;
      return !hasFlightFields;
    }
    return true;
  },
  { message: "Flight fields can only be set on travel segments" }
)
.refine(
  (data) => {
    if (data.type === "travel" && data.departureDatetime && data.arrivalDatetime) {
      return new Date(data.departureDatetime) < new Date(data.arrivalDatetime);
    }
    return true;
  },
  { message: "Arrival must be after departure" }
)
.refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: "End time must be after start time" }
);

export const CreateStaySchema = z.object({
  hotelName: z.string().min(1, "Hotel name is required"),
  address: z.string().optional(),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.checkInDate < data.checkOutDate,
  { message: "Check-out must be after check-in" }
);

export const AttachItinerarySchema = z.object({
  itineraryId: z.number(),
});


const TRAVEL_MODES = ["flight", "train", "bus", "transfer", "other"] as const;

export const CreateLegSchema = z.object({
  travelMode: z.enum(TRAVEL_MODES),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departureAt: z.string().optional(),
  arrivalAt: z.string().optional(),
  originTimezone: z.string().optional(),
  destinationTimezone: z.string().optional(),
  operator: z.string().optional(),
  identifier: z.string().optional(),
  reference: z.string().optional(),
});

export const UpdateLegSchema = z.object({
  travelMode: z.enum(TRAVEL_MODES).optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  departureAt: z.string().optional(),
  arrivalAt: z.string().optional(),
  originTimezone: z.string().optional(),
  destinationTimezone: z.string().optional(),
  operator: z.string().optional(),
  identifier: z.string().optional(),
  reference: z.string().optional(),
});


const BLOCK_TYPES = ["image", "callout", "notice"] as const;
const BLOCK_SLOTS = ["before-day", "after-morning", "after-afternoon", "after-evening"] as const;
const BLOCK_SIZES = ["small", "medium", "full"] as const;
const BLOCK_VARIANTS = ["tip", "warning", "info"] as const;

export const CreateItineraryBlockSchema = z.object({
  itineraryId: z.number(),
  sectionId: z.number().nullable().optional(),
  dayId: z.number().nullable().optional(),
  blockType: z.enum(BLOCK_TYPES),
  slot: z.enum(BLOCK_SLOTS),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  textContent: z.string().optional(),
  variant: z.enum(BLOCK_VARIANTS).optional(),
  size: z.enum(BLOCK_SIZES).optional(),
  paletteOverride: z.string().nullable().optional(),
  position: z.number().optional(),
})
.refine((data) => {
  const hasSection = data.sectionId != null;
  const hasDay = data.dayId != null;
  return hasSection !== hasDay;
}, { message: "Block must belong to exactly one of sectionId or dayId" });

export const UpdateItineraryBlockSchema = z.object({
  slot: z.enum(BLOCK_SLOTS).optional(),
  position: z.number().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  textContent: z.string().optional(),
  variant: z.enum(BLOCK_VARIANTS).optional(),
  size: z.enum(BLOCK_SIZES).optional(),
  paletteOverride: z.string().nullable().optional(),
});

export const PALETTE_NAMES = [
  "Coastal", "Desert", "Alpine", "Editorial", "Tropical", "Minimal",
] as const;

export const UpdateItineraryThemeSchema = z.object({
  themePreset: z.union([z.enum(PALETTE_NAMES), z.null()]).optional(),
});

export const UpdateSectionThemeOverrideSchema = z.object({
  themePresetOverride: z.union([z.enum(PALETTE_NAMES), z.null()]).optional(),
});


const TRAVEL_MODES_BULK = ["flight", "train", "bus", "transfer", "other"] as const;

export const BulkAddSegmentSchema = z.object({
  type: z.enum(["activity", "travel", "meal", "free_day"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  location: z.string().optional(),
  instructions: z.string().optional(),
  leg: z.object({
    travelMode: z.enum(TRAVEL_MODES_BULK),
    origin: z.string().optional(),
    destination: z.string().optional(),
    departureAt: z.string().optional(),
    arrivalAt: z.string().optional(),
    operator: z.string().optional(),
    identifier: z.string().optional(),
    reference: z.string().optional(),
  }).optional(),
});

export const BulkAddRequestSchema = z.object({
  segments: z.array(BulkAddSegmentSchema).min(1, "At least one segment required"),
});
