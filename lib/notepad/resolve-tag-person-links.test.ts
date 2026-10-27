import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveTagPersonLinks } from "./resolve-tag-person-links";
import * as dbModule from "@/lib/db";

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

describe("resolveTagPersonLinks", () => {
  let mockDb: any;

  beforeEach(() => {
    vi.resetAllMocks();
    mockDb = dbModule.db as any;
  });

  it("resolves portal member exact name match", async () => {
    mockDb.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ personId: 3 }]),
          }),
        }),
      });

    const result = await resolveTagPersonLinks(["Calven"], 1);
    expect(result).toEqual([{ tag: "Calven", personId: 3 }]);
  });

  it("resolves portal member exact email match", async () => {
    mockDb.select
      .mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ personId: 5 }]),
          }),
        }),
      });

    const result = await resolveTagPersonLinks(["calven@example.com"], 1);
    expect(result).toEqual([{ tag: "calven@example.com", personId: 5 }]);
  });

  it("falls back to global canonical_name exact match", async () => {
    // Portal member: no match
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
    });
    // People: single match
    mockDb.select.mockReturnValueOnce({
      from: () => ({
        where: () => Promise.resolve([{ id: 7 }]),
      }),
    });

    const result = await resolveTagPersonLinks(["Tokyo"], 1);
    expect(result).toEqual([{ tag: "Tokyo", personId: 7 }]);
  });

  it("returns null when no match anywhere", async () => {
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    });

    const result = await resolveTagPersonLinks(["Airbnb"], 1);
    expect(result).toEqual([{ tag: "Airbnb", personId: null }]);
  });

  it("returns null and warns on duplicate canonical_name matches", async () => {
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([{ id: 10 }, { id: 11 }]) }),
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await resolveTagPersonLinks(["John Smith"], 1);
    expect(result).toEqual([{ tag: "John Smith", personId: null }]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("duplicate canonical_name")
    );
    warnSpy.mockRestore();
  });

  it("skips empty tags", async () => {
    const result = await resolveTagPersonLinks(["", "  "], 1);
    expect(result).toEqual([]);
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("preserves tag text with whitespace trimmed", async () => {
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }),
    });
    mockDb.select.mockReturnValueOnce({
      from: () => ({ where: () => Promise.resolve([]) }),
    });

    const result = await resolveTagPersonLinks(["  Calven  "], 1);
    expect(result).toEqual([{ tag: "Calven", personId: null }]);
  });
});
