import { z } from "zod";

const SEGMENT_TYPES = ["activity", "travel", "meal", "free_day"] as const;

export const CreateItinerarySchema = z.object({
  portalId: z.number(),
  title: z.string().min(1, "Title is required"),
});

export const UpdateItinerarySchema = z.object({
  title: z.string().min(1).optional(),
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
