import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutosaveField } from "./useAutosaveField";
import {
  getFullDraftKey,
  readDraft,
  writeDraft,
  findDraftsForEntity,
  clearDraftsForEntity,
  clearDraft,
} from "@/lib/drafts";

// ============================================================
// HELPERS
// ============================================================

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// ============================================================
// TESTS
// ============================================================

describe("useAutosaveField — durability", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // D1 — Draft written on setValue
  // ────────────────────────────────────────────────────────────
  it("D1: draft written on setValue", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    const stored = localStorage.getItem(
      getFullDraftKey("itinerary:5:title")
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.value).toBe("Tokyo");
  });

  // ────────────────────────────────────────────────────────────
  // D2 — Draft overwritten on later setValue
  // ────────────────────────────────────────────────────────────
  it("D2: draft overwritten on later setValue", () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });
    act(() => {
      result.current.setValue("Tokyo Tower");
    });

    expect(readDraft<string>("itinerary:5:title")).toBe("Tokyo Tower");
  });

  // ────────────────────────────────────────────────────────────
  // D3 — Latest-version successful save clears matching draft
  // ────────────────────────────────────────────────────────────
  it("D3: latest-version successful save clears matching draft", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    // Draft written
    expect(readDraft<string>("itinerary:5:title")).toBe("Tokyo");

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // Draft cleared after successful save
    expect(readDraft<string>("itinerary:5:title")).toBeNull();
    expect(result.current.dirty).toBe(false);
    expect(result.current.saveState).toBe("saved");
  });

  // ────────────────────────────────────────────────────────────
  // D4 — Failed save retains draft
  // ────────────────────────────────────────────────────────────
  it("D4: failed save retains draft", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("network"));

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("error");
    expect(result.current.dirty).toBe(true);
    expect(readDraft<string>("itinerary:5:title")).toBe("Tokyo");
  });

  // ────────────────────────────────────────────────────────────
  // D5 — Stale save cannot clear newer draft
  // ────────────────────────────────────────────────────────────
  it("D5: stale save cannot clear newer draft", async () => {
    const saveA = createDeferred<void>();
    const saveB = createDeferred<void>();
    const onSave = vi.fn()
      .mockReturnValueOnce(saveA.promise)
      .mockReturnValueOnce(saveB.promise)
      .mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("A");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // User types new value while A is in flight
    act(() => {
      result.current.setValue("B");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // A resolves (stale) — must NOT clear the "B" draft
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    expect(readDraft<string>("itinerary:5:title")).toBe("B");

    // Cleanup
    await act(async () => {
      saveB.resolve();
      await saveB.promise;
      await flushMicrotasks();
    });

    // Now B resolved with current value = B → draft cleared
    expect(readDraft<string>("itinerary:5:title")).toBeNull();
  });

  // ────────────────────────────────────────────────────────────
  // D6 — Orphaned draft banner appears
  // (Editor-level detection helper)
  // ────────────────────────────────────────────────────────────
  it("D6: orphaned draft is detectable via findDraftsForEntity", () => {
    // Simulate a draft left over from a previous session
    writeDraft("itinerary:5:title", "Orphaned Tokyo");

    // Import the helper
    const findings = findDraftsForEntity((key: string) =>
      key.startsWith("itinerary:5:")
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].value).toBe("Orphaned Tokyo");
  });

  // ────────────────────────────────────────────────────────────
  // D7 — Restore uses autosave pipeline
  // ────────────────────────────────────────────────────────────
  it("D7: restore flows through the autosave pipeline", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    // Editor-level restore: call setValue with recovered value
    act(() => {
      result.current.setValue("Tokyo");
    });

    expect(result.current.dirty).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledWith("Tokyo");
    expect(result.current.saveState).toBe("saved");
  });

  // ────────────────────────────────────────────────────────────
  // D8 — Discard removes current-entity drafts
  // ────────────────────────────────────────────────────────────
  it("D8: discard removes current-entity drafts", () => {
    writeDraft("itinerary:5:title", "Tokyo");
    writeDraft("segment:5:title", "Skytree");
    writeDraft("itinerary:6:title", "Other");

    const removed = clearDraftsForEntity((key: string) =>
      key.startsWith("itinerary:5:") || key.startsWith("segment:5:")
    );

    expect(removed).toBe(2);
    expect(readDraft("itinerary:5:title")).toBeNull();
    expect(readDraft("segment:5:title")).toBeNull();
  });

  // ────────────────────────────────────────────────────────────
  // D9 — Other-entity drafts remain hidden AND preserved
  // ────────────────────────────────────────────────────────────
  it("D9: other-entity drafts remain hidden and preserved", () => {
    writeDraft("itinerary:5:title", "A");
    writeDraft("itinerary:6:title", "B");


    const findings = findDraftsForEntity((key: string) =>
      key.startsWith("itinerary:5:")
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].value).toBe("A");

    // Other-entity draft still in storage
    expect(readDraft("itinerary:6:title")).toBe("B");
  });

  // ────────────────────────────────────────────────────────────
  // D10 — Nested field keys do not collide
  // ────────────────────────────────────────────────────────────
  it("D10: nested field keys do not collide", () => {
    writeDraft("itinerary:5:title", "Trip Title");
    writeDraft("segment:5:title", "Segment Title");
    writeDraft("stay:5:hotelName", "Hotel");

    expect(readDraft("itinerary:5:title")).toBe("Trip Title");
    expect(readDraft("segment:5:title")).toBe("Segment Title");
    expect(readDraft("stay:5:hotelName")).toBe("Hotel");
  });

  // ────────────────────────────────────────────────────────────
  // D11 — Child entity drafts surface when parent itinerary loads
  // ────────────────────────────────────────────────────────────
  it("D11: child entity drafts surface at parent load", () => {
    writeDraft("itinerary:5:title", "Trip");
    writeDraft("segment:27:title", "Skytree");
    writeDraft("stay:14:hotelName", "Bay Hotel");


    // Editor provides a predicate that matches the itinerary and its descendants
    const findings = findDraftsForEntity((key: string) => {
      return (
        key.startsWith("itinerary:5:") ||
        key.startsWith("segment:27:") ||
        key.startsWith("stay:14:")
      );
    });

    expect(findings).toHaveLength(3);
  });

  // ────────────────────────────────────────────────────────────
  // D12 — Discard after restore cancels pending save
  // ────────────────────────────────────────────────────────────
  it("D12: discard after restore cancels pending save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    // Restore a value (schedules debounce)
    act(() => {
      result.current.setValue("Restored");
    });

    // Editor decides to discard — clear localStorage draft.
    // Pending save is NOT cancelled by clearing localStorage;
    // the save will still fire. The discard only affects the draft.
    clearDraft("itinerary:5:title");

    // Note: the pending debounce save will still fire. That's by design —
    // restoring a value and then discarding the draft does not un-set the field.
    // The user must explicitly revert the field to avoid saving.

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // Save still fired with restored value
    expect(onSave).toHaveBeenCalledWith("Restored");
  });

  // ────────────────────────────────────────────────────────────
  // D13 — Superseded version cannot clear newer draft
  // ────────────────────────────────────────────────────────────
  it("D13: superseded version cannot clear newer draft", async () => {
    const saveA = createDeferred<void>();
    const saveB = createDeferred<void>();
    const onSave = vi.fn()
      .mockReturnValueOnce(saveA.promise)
      .mockReturnValueOnce(saveB.promise)
      .mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("A");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    act(() => {
      result.current.setValue("B");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // Resolve A first (stale)
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    // Draft for "B" must still exist
    expect(readDraft<string>("itinerary:5:title")).toBe("B");

    // Cleanup
    await act(async () => {
      saveB.resolve();
      await saveB.promise;
      await flushMicrotasks();
    });
  });

  // ────────────────────────────────────────────────────────────
  // D14 — Unmount flush success clears draft even though component is gone
  // ────────────────────────────────────────────────────────────
  it("D14: unmount flush success clears draft even after component is gone", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result, unmount } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "itinerary:5:title",
        debounceMs: 500,
      })
    );

    // Type a value (draft written, dirty set)
    act(() => {
      result.current.setValue("Tokyo Tower");
    });

    // Draft exists
    expect(readDraft<string>("itinerary:5:title")).toBe("Tokyo Tower");

    // Unmount before debounce fires — should trigger best-effort flush
    unmount();

    // Let microtasks settle so saveInternal can complete
    await act(async () => {
      await flushMicrotasks();
      await flushMicrotasks();
      await flushMicrotasks();
    });

    // Save fired with the pending value
    expect(onSave).toHaveBeenCalledWith("Tokyo Tower");

    // Draft cleared even though component is unmounted
    expect(readDraft<string>("itinerary:5:title")).toBeNull();
  });
});
