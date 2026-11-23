import { describe, it, expect } from "vitest";
import { parseBooking, findDates, findTimes, parseDateToISO } from "./parseBooking";

describe("date/time extraction", () => {
  it("normalizes the common date formats", () => {
    expect(parseDateToISO("March 1, 2027")).toBe("2027-03-01");
    expect(parseDateToISO("Mar 1 2027")).toBe("2027-03-01");
    expect(parseDateToISO("1 Mar 2027")).toBe("2027-03-01");
    expect(parseDateToISO("2027-03-01")).toBe("2027-03-01");
    expect(parseDateToISO("no date here")).toBeNull();
  });

  it("finds dates in order without duplicates", () => {
    expect(findDates("Depart March 1, 2027, return March 8, 2027 (March 1, 2027)")).toEqual([
      "2027-03-01",
      "2027-03-08",
    ]);
  });

  it("converts times to 24-hour", () => {
    expect(findTimes("Departs 10:05 PM, arrives 11:05 AM; also 22:30")).toEqual([
      "22:05",
      "11:05",
      "22:30",
    ]);
    expect(findTimes("12:00 PM and 12:00 AM")).toEqual(["12:00", "00:00"]);
  });
});

describe("parseBooking", () => {
  it("keeps the Air Canada behavior and now adds times", () => {
    const r = parseBooking(
      "Air Canada AC 123\nToronto (YYZ) to London (LHR)\nDepart: March 1, 2027 at 10:00 PM\nArrive: March 2, 2027 at 10:00 AM\nConfirmation: ABC123"
    );
    expect(r.source).toBe("air-canada");
    expect(r.booking.flightNumber).toBe("AC0123");
    expect(r.booking.origin).toBe("YYZ");
    expect(r.booking.destination).toBe("LHR");
    expect(r.booking.departureAt).toBe("2027-03-01T22:00");
    expect(r.booking.arrivalAt).toBe("2027-03-02T10:00");
    expect(r.booking.reference).toBe("ABC123");
  });

  it("parses a generic airline confirmation (Delta)", () => {
    const r = parseBooking(
      "Delta Air Lines DL456\nATL to LAX\nMarch 5, 2027 8:30 AM - 11:45 AM\nBooking reference: XYZ789"
    );
    expect(r.source).toBe("flight-generic");
    expect(r.booking.airline).toBe("Delta Air Lines");
    expect(r.booking.flightNumber).toBe("DL456");
    expect(r.booking.origin).toBe("ATL");
    expect(r.booking.destination).toBe("LAX");
    expect(r.booking.departureAt).toBe("2027-03-05T08:30");
    expect(r.booking.arrivalAt).toBe("2027-03-05T11:45");
  });

  it("rolls the arrival to the next day when the time is earlier and no second date is given", () => {
    const r = parseBooking("BA 117\nJFK to LHR\nJune 10, 2027\nDeparts 9:30 PM Arrives 9:35 AM");
    expect(r.source).toBe("flight-generic");
    expect(r.booking.departureAt).toBe("2027-06-10T21:30");
    expect(r.booking.arrivalAt).toBe("2027-06-11T09:35");
  });

  it("does not claim a bare flight number with no route or time", () => {
    const r = parseBooking("Your DL456 is confirmed. See you soon!");
    expect(r.source).toBe("unknown");
  });

  it("parses a cruise confirmation with ship, cabin, dates and ports", () => {
    const text = [
      "Royal Caribbean International",
      "Ship: Icon of the Seas",
      "Sailing Date: March 6, 2027",
      "Return: March 13, 2027",
      "Stateroom: 8254",
      "Deck: 8",
      "Itinerary",
      "Day 1: Miami, Florida",
      "Day 2: At Sea",
      "Day 3: Nassau, Bahamas",
      "Day 8: Miami, Florida",
      "Confirmation: CRZ456",
    ].join("\n");
    const r = parseBooking(text);
    expect(r.source).toBe("cruise");
    expect(r.booking.ship).toBe("Icon of the Seas");
    expect(r.booking.cruiseLine).toBe("Royal Caribbean");
    expect(r.booking.cabin).toBe("8254");
    expect(r.booking.deck).toBe("8");
    expect(r.booking.checkInDate).toBe("2027-03-06");
    expect(r.booking.checkOutDate).toBe("2027-03-13");
    expect(r.booking.ports).toEqual(["Miami, Florida", "At Sea", "Nassau, Bahamas", "Miami, Florida"]);
    expect(r.booking.embarkPort).toBe("Miami, Florida");
    expect(r.booking.disembarkPort).toBe("Miami, Florida");
  });

  it("recognizes an 'of the Seas' ship without a label", () => {
    const r = parseBooking(
      "Your cruise on Symphony of the Seas sails March 6, 2027 to March 13, 2027. Stateroom 10234, Deck 10."
    );
    expect(r.source).toBe("cruise");
    expect(r.booking.ship).toBe("Symphony of the Seas");
    expect(r.booking.cabin).toBe("10234");
  });

  it("parses a hotel confirmation with ISO-normalized dates", () => {
    const r = parseBooking(
      "Fairmont Royal York\n111 Front Street West\nCheck-in: March 1, 2027\nCheck-out: March 4, 2027"
    );
    expect(r.source).toBe("hotel-generic");
    expect(r.booking.hotelName).toContain("Fairmont");
    expect(r.booking.checkInDate).toBe("2027-03-01");
    expect(r.booking.checkOutDate).toBe("2027-03-04");
  });
});
