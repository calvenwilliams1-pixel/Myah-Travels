import { describe, it, expect } from "vitest";
import {
  getAirports,
  getAirlines,
  getCruiseLines,
  getResortBrands,
  searchAirports,
  searchAirlines,
  searchCruiseLines,
  searchShips,
  searchResortBrands,
} from "./statics";

// These tests run against the real catalog files in data/ — they double
// as a tripwire if a regeneration ever shrinks or breaks a dataset.

describe("airports catalog (Batch 0 backfill)", () => {
  it("holds the full scheduled-service set, every entry with a timezone", () => {
    const airports = getAirports();
    expect(airports.length).toBeGreaterThan(3000);
    const withTz = airports.filter((a) => a.timezone).length;
    expect(withTz / airports.length).toBeGreaterThan(0.99);
  });

  it("finds Toronto Pearson by code and by name, with its timezone", () => {
    const byCode = searchAirports("YYZ");
    expect(byCode[0]?.iata).toBe("YYZ");
    expect(byCode[0]?.timezone).toBe("America/Toronto");
    const byName = searchAirports("pearson");
    expect(byName.some((a) => a.iata === "YYZ")).toBe(true);
  });

  it("carries proper IANA timezones for resort and cruise ports", () => {
    expect(searchAirports("PUJ")[0]?.timezone).toBe("America/Santo_Domingo");
    expect(searchAirports("NRT")[0]?.timezone).toBe("Asia/Tokyo");
  });
});

describe("airlines catalog (Batch 0 backfill)", () => {
  it("holds the active carrier set", () => {
    expect(getAirlines().length).toBeGreaterThan(900);
    expect(searchAirlines("westjet").some((a) => a.iata === "WS")).toBe(true);
    expect(searchAirlines("AC").some((a) => a.name === "Air Canada")).toBe(true);
  });
});

describe("cruise catalog (Batch 0, curated)", () => {
  it("covers the major lines and their fleets", () => {
    const lines = getCruiseLines();
    expect(lines.length).toBeGreaterThanOrEqual(25);
    const ships = lines.reduce((n, l) => n + l.ships.length, 0);
    expect(ships).toBeGreaterThanOrEqual(250);
  });

  it("finds a ship and names its line", () => {
    const hits = searchShips("icon of the seas");
    expect(hits[0]).toEqual({ ship: "Icon of the Seas", line: "Royal Caribbean International" });
  });

  it("finds lines by name", () => {
    expect(searchCruiseLines("norwegian")[0]?.name).toBe("Norwegian Cruise Line");
  });
});

describe("resort brands catalog (Batch 0, curated)", () => {
  it("covers the major all-inclusive brands", () => {
    expect(getResortBrands().length).toBeGreaterThanOrEqual(40);
    expect(searchResortBrands("sandals")[0]?.name).toBe("Sandals Resorts");
    expect(searchResortBrands("riu")[0]?.name).toContain("RIU");
  });
});
