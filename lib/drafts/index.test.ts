import { describe, it, expect, beforeEach } from "vitest";
import {
  writeDraft,
  readDraft,
  clearDraft,
  getFullDraftKey,
  getAllDraftKeys,
  findDraftsForEntity,
  clearDraftsForEntity,
} from "./index";

describe("lib/drafts — storage layer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ────────────────────────────────────────────────────────────
  // Basic write / read / clear
  // ────────────────────────────────────────────────────────────

  it("writeDraft writes to localStorage under the prefixed key", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    const raw = localStorage.getItem("myahtravels:draft:itinerary:5:title");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.value).toBe("Tokyo");
    expect(typeof parsed.timestamp).toBe("number");
  });

  it("readDraft returns the stored value", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    expect(readDraft<string>("itinerary:5:title")).toBe("Tokyo");
  });

  it("readDraft returns null for missing key", () => {
    expect(readDraft("nonexistent")).toBeNull();
  });

  it("clearDraft removes the stored value", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    clearDraft("itinerary:5:title");
    expect(localStorage.getItem("myahtravels:draft:itinerary:5:title")).toBeNull();
  });

  it("writeDraft overwrites on subsequent call", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    writeDraft("itinerary:5:title", "Tokyo Tower");
    expect(readDraft<string>("itinerary:5:title")).toBe("Tokyo Tower");
  });

  // ────────────────────────────────────────────────────────────
  // Key prefix
  // ────────────────────────────────────────────────────────────

  it("getFullDraftKey returns the prefixed key", () => {
    expect(getFullDraftKey("itinerary:5:title")).toBe(
      "myahtravels:draft:itinerary:5:title"
    );
  });

  // ────────────────────────────────────────────────────────────
  // Key isolation
  // ────────────────────────────────────────────────────────────

  it("keys for different entities do not collide", () => {
    writeDraft("itinerary:5:title", "A");
    writeDraft("itinerary:6:title", "B");
    writeDraft("segment:5:title", "C");
    expect(readDraft<string>("itinerary:5:title")).toBe("A");
    expect(readDraft<string>("itinerary:6:title")).toBe("B");
    expect(readDraft<string>("segment:5:title")).toBe("C");
  });

  it("nested entity keys do not collide with parent keys", () => {
    writeDraft("itinerary:5:title", "Parent");
    writeDraft("segment:5:title", "Child");
    expect(readDraft<string>("itinerary:5:title")).toBe("Parent");
    expect(readDraft<string>("segment:5:title")).toBe("Child");
  });

  // ────────────────────────────────────────────────────────────
  // Bulk operations
  // ────────────────────────────────────────────────────────────

  it("getAllDraftKeys returns all draft keys without prefix", () => {
    writeDraft("itinerary:5:title", "A");
    writeDraft("segment:5:title", "B");
    const keys = getAllDraftKeys();
    expect(keys).toContain("itinerary:5:title");
    expect(keys).toContain("segment:5:title");
    // No prefix included
    expect(keys.every((k) => !k.startsWith("myahtravels:"))).toBe(true);
  });

  it("getAllDraftKeys returns empty array when no drafts exist", () => {
    expect(getAllDraftKeys()).toEqual([]);
  });

  it("getAllDraftKeys ignores non-draft localStorage keys", () => {
    localStorage.setItem("some-other-app-key", "value");
    writeDraft("itinerary:5:title", "A");
    const keys = getAllDraftKeys();
    expect(keys).toEqual(["itinerary:5:title"]);
  });

  // ────────────────────────────────────────────────────────────
  // findDraftsForEntity
  // ────────────────────────────────────────────────────────────

  it("findDraftsForEntity returns matching drafts", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    writeDraft("segment:5:title", "Skytree");
    writeDraft("itinerary:6:title", "Other");

    const findings = findDraftsForEntity(
      (key) => key.startsWith("itinerary:5:") || key.startsWith("segment:5:")
    );

    expect(findings).toHaveLength(2);
    expect(findings.map((f) => f.draftKey).sort()).toEqual([
      "itinerary:5:title",
      "segment:5:title",
    ]);
  });

  it("findDraftsForEntity includes value and timestamp", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    const findings = findDraftsForEntity((key) => key.startsWith("itinerary:5:"));
    expect(findings[0].value).toBe("Tokyo");
    expect(typeof findings[0].timestamp).toBe("number");
  });

  it("findDraftsForEntity returns empty when no matches", () => {
    writeDraft("itinerary:6:title", "Other");
    const findings = findDraftsForEntity((key) => key.startsWith("itinerary:5:"));
    expect(findings).toEqual([]);
  });

  it("findDraftsForEntity skips malformed JSON entries", () => {
    localStorage.setItem("myahtravels:draft:itinerary:5:bad", "not-json{");
    writeDraft("itinerary:5:title", "Good");
    const findings = findDraftsForEntity((key) => key.startsWith("itinerary:5:"));
    expect(findings).toHaveLength(1);
    expect(findings[0].draftKey).toBe("itinerary:5:title");
  });

  // ────────────────────────────────────────────────────────────
  // clearDraftsForEntity
  // ────────────────────────────────────────────────────────────

  it("clearDraftsForEntity removes only matching drafts", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    writeDraft("segment:5:title", "Skytree");
    writeDraft("itinerary:6:title", "Other");

    const removed = clearDraftsForEntity(
      (key) => key.startsWith("itinerary:5:") || key.startsWith("segment:5:")
    );

    expect(removed).toBe(2);
    expect(readDraft("itinerary:5:title")).toBeNull();
    expect(readDraft("segment:5:title")).toBeNull();
    expect(readDraft("itinerary:6:title")).toBe("Other"); // preserved
  });

  it("clearDraftsForEntity returns 0 when nothing matches", () => {
    writeDraft("itinerary:6:title", "Other");
    const removed = clearDraftsForEntity((key) => key.startsWith("itinerary:5:"));
    expect(removed).toBe(0);
    expect(readDraft("itinerary:6:title")).toBe("Other");
  });

  // ────────────────────────────────────────────────────────────
  // Failure safety
  // ────────────────────────────────────────────────────────────

  it("writeDraft does not throw when localStorage throws", () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error("quota exceeded");
    };

    expect(() => writeDraft("itinerary:5:title", "Tokyo")).not.toThrow();

    Storage.prototype.setItem = originalSetItem;
  });

  it("clearDraft does not throw when localStorage throws", () => {
    const originalRemoveItem = Storage.prototype.removeItem;
    Storage.prototype.removeItem = () => {
      throw new Error("removeItem failed");
    };

    expect(() => clearDraft("itinerary:5:title")).not.toThrow();

    Storage.prototype.removeItem = originalRemoveItem;
  });
});
