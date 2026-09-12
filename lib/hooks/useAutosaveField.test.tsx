import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutosaveField } from "./useAutosaveField";
import { getFullDraftKey } from "@/lib/drafts";

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

// Drain pending microtasks so that any resolved promise chains settle.
async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

// ============================================================
// TESTS
// ============================================================

describe("useAutosaveField", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // A1 — Debounce basic save
  // ────────────────────────────────────────────────────────────
  it("A1: debounce basic save — one save after 500ms with typed value", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A1",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    // Not yet saved
    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Tokyo");
  });

  // ────────────────────────────────────────────────────────────
  // A2 — Debounce collapse
  // ────────────────────────────────────────────────────────────
  it("A2: debounce collapse — rapid typing results in one save with final value", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A2",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("T");
      result.current.setValue("To");
      result.current.setValue("Tok");
      result.current.setValue("Tokyo");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Tokyo");
  });

  // ────────────────────────────────────────────────────────────
  // A3 — Flush cancels debounce
  // ────────────────────────────────────────────────────────────
  it("A3: flush cancels pending debounce — no duplicate save", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A3",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    // Flush before debounce fires
    await act(async () => {
      await result.current.flush();
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    // Advance time past original debounce — should NOT trigger second save
    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  // ────────────────────────────────────────────────────────────
  // A4 — Flush triggers save
  // ────────────────────────────────────────────────────────────
  it("A4: flush triggers save with current value", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A4",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    await act(async () => {
      await result.current.flush();
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("Tokyo");
  });

  // ────────────────────────────────────────────────────────────
  // A5 — Version gating: newer save wins in UI state
  // ────────────────────────────────────────────────────────────
  it("A5: version gating — newer save wins in UI state", async () => {
    const saveA = createDeferred<void>();
    const saveB = createDeferred<void>();
    const onSave = vi.fn()
      .mockReturnValueOnce(saveA.promise)
      .mockReturnValueOnce(saveB.promise);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A5",
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

    // Resolve A (stale) then B (latest)
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    await act(async () => {
      saveB.resolve();
      await saveB.promise;
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("saved");
  });

  // ────────────────────────────────────────────────────────────
  // A6 — Stale response ignored
  // ────────────────────────────────────────────────────────────
  it("A6: stale response does not update saveState to saved after newer error", async () => {
    const saveA = createDeferred<void>();
    const saveB = createDeferred<void>();
    const onSave = vi.fn()
      .mockReturnValueOnce(saveA.promise)
      .mockReturnValueOnce(saveB.promise);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A6",
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

    // B fails (latest)
    await act(async () => {
      saveB.reject(new Error("network"));
      await saveB.promise.catch(() => {});
      await flushMicrotasks();
    });

    // A succeeds (stale) — should not flip saveState to "saved"
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("error");
  });

  // ────────────────────────────────────────────────────────────
  // A7 — Failed save retains draft
  // ────────────────────────────────────────────────────────────
  it("A7: failed save retains draft, dirty, and error state", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("network"));

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A7",
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
    expect(localStorage.getItem(getFullDraftKey("test:A7"))).not.toBeNull();
  });

  // ────────────────────────────────────────────────────────────
  // A8 — Retry triggers save
  // ────────────────────────────────────────────────────────────
  it("A8: retry triggers save through the normal pipeline", async () => {
    const onSave = vi.fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A8",
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

    await act(async () => {
      await result.current.retry();
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(result.current.saveState).toBe("saved");
    expect(result.current.dirty).toBe(false);
  });

  // ────────────────────────────────────────────────────────────
  // A9 — Retry preserves version ordering
  // ────────────────────────────────────────────────────────────
  it("A9: retry preserves version ordering — stale cannot override retry", async () => {
    const saveA = createDeferred<void>();
    const saveRetry = createDeferred<void>();
    const onSave = vi.fn()
      .mockReturnValueOnce(saveA.promise)       // A fires with "Tokyo"
      .mockReturnValueOnce(saveRetry.promise)   // retry fires with "Tokyo Tower"
      .mockResolvedValue(undefined);            // fallback for any further saves

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A9",
        debounceMs: 500,
      })
    );

    // Save A fires with "Tokyo"
    act(() => {
      result.current.setValue("Tokyo");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // Save A is in flight. User edits to a new value.
    // Retry saves currentValueRef.current, which is now "Tokyo Tower" —
    // a different value, so no same-value dedup collision with A.
    act(() => {
      result.current.setValue("Tokyo Tower");
    });

    // User clicks retry (fires second save with "Tokyo Tower")
    act(() => {
      result.current.retry();
    });

    await flushMicrotasks();

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenNthCalledWith(1, "Tokyo");
    expect(onSave).toHaveBeenNthCalledWith(2, "Tokyo Tower");

    // Retry (higher version) resolves first
    await act(async () => {
      saveRetry.resolve();
      await saveRetry.promise;
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("saved");

    // Original save A resolves (stale) — must NOT override retry state
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("saved");
  });

  it("A10: flush during in-flight save with same value does not trigger duplicate", async () => {
    const save = createDeferred<void>();
    const onSave = vi.fn().mockReturnValue(save.promise);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A10",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    // Debounce fires, save starts
    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    // Flush while still in flight with same value
    await act(async () => {
      await result.current.flush();
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    // Cleanup
    await act(async () => {
      save.resolve();
      await save.promise;
      await flushMicrotasks();
    });
  });

  // ────────────────────────────────────────────────────────────
  // A11 — Flush during in-flight (different value) triggers new save
  // ────────────────────────────────────────────────────────────
  it("A11: flush during in-flight with different value triggers new save", async () => {
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
        draftKey: "test:A11",
        debounceMs: 500,
      })
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(onSave).toHaveBeenCalledTimes(1);

    // Change value and flush before A resolves
    act(() => {
      result.current.setValue("Tokyo Tower");
    });

    // Fire flush WITHOUT awaiting — it will block on unresolved saveB
    act(() => {
      result.current.flush();
    });

    // Let the sync part of saveInternal run
    await flushMicrotasks();

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(onSave).toHaveBeenLastCalledWith("Tokyo Tower");

    // Resolve A first (stale), then B (latest)
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    await act(async () => {
      saveB.resolve();
      await saveB.promise;
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("saved");
  });

  it("A12: double-click retry does not trigger duplicate save", async () => {
    const saveRetry = createDeferred<void>();
    const onSave = vi.fn()
      .mockRejectedValueOnce(new Error("network"))
      .mockReturnValueOnce(saveRetry.promise);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A12",
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
    expect(onSave).toHaveBeenCalledTimes(1);

    // Double-click retry
    await act(async () => {
      result.current.retry();
      result.current.retry();
      await flushMicrotasks();
    });

    // Dedup should have prevented the second retry from firing a new save
    expect(onSave).toHaveBeenCalledTimes(2);

    // Cleanup
    await act(async () => {
      saveRetry.resolve();
      await saveRetry.promise;
      await flushMicrotasks();
    });
  });

  // ────────────────────────────────────────────────────────────
  // A13 — Strict Mode double-invoke does not break saveState
  // ────────────────────────────────────────────────────────────
  it("A13: Strict Mode double-invoke does not break saveState", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(
      () =>
        useAutosaveField<string>({
          value: "",
          onSave,
          draftKey: "test:A13",
          debounceMs: 500,
        }),
      { wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode> }
    );

    act(() => {
      result.current.setValue("Tokyo");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("saved");

    // A second edit should still work correctly after the initial mount cycle
    act(() => {
      result.current.setValue("Tokyo Tower");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    expect(result.current.saveState).toBe("saved");
    expect(onSave).toHaveBeenCalledTimes(2);
  });

  // ────────────────────────────────────────────────────────────
  // A14 — Revert during concurrent in-flight saves
  //
  // IMPORTANT: each resolution must be in its OWN await act() block.
  // Collapsing both into one act() can let React settle both promises
  // before the intermediate assertion runs, masking a real STEP 6
  // regression in version gating.
  // ────────────────────────────────────────────────────────────
  it("A14: revert during concurrent in-flight saves does not duplicate earlier value", async () => {
    const saveA = createDeferred<void>();
    const saveB = createDeferred<void>();
    const onSave = vi.fn()
      .mockReturnValueOnce(saveA.promise)
      .mockReturnValueOnce(saveB.promise);

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A14",
        debounceMs: 500,
      })
    );

    // A fires
    act(() => {
      result.current.setValue("A");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // B fires
    act(() => {
      result.current.setValue("B");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // User reverts to "A" while both are in flight — dedup prevents new save
    act(() => {
      result.current.setValue("A");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // Only two saves total (A and B)
    expect(onSave).toHaveBeenCalledTimes(2);

    // Resolve both (order doesn't matter for A14)
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    await act(async () => {
      saveB.resolve();
      await saveB.promise;
      await flushMicrotasks();
    });

    // ─── External-state assertions ───
    expect(result.current.saveState).toBe("saved");
    // savedValueRef is not directly observable — but its effect is:
    // the higher-versioned save (B) is what should be considered "last saved",
    // meaning a draft must still exist because the current value ("A") differs
    // from the last successfully saved value ("B").
    expect(result.current.dirty).toBe(true);
    expect(localStorage.getItem(getFullDraftKey("test:A14"))).not.toBeNull();
  });

  // ────────────────────────────────────────────────────────────
  // A15 — Out-of-order resolution does not corrupt version-ordered state
  //
  // IMPORTANT: each resolution must be in its OWN await act() block.
  // Collapsing both into one act() can let React settle both promises
  // before the intermediate assertion runs, masking a real STEP 6
  // regression in version gating.
  // ────────────────────────────────────────────────────────────
  it("A15: out-of-order resolution does not corrupt version-ordered state", async () => {
    const saveA = createDeferred<void>();
    const saveB = createDeferred<void>();
    const onSave = vi.fn()
      .mockReturnValueOnce(saveA.promise)
      .mockReturnValueOnce(saveB.promise)
      .mockResolvedValueOnce(undefined); // for the post-condition save

    const { result } = renderHook(() =>
      useAutosaveField<string>({
        value: "",
        onSave,
        draftKey: "test:A15",
        debounceMs: 500,
      })
    );

    // A fires
    act(() => {
      result.current.setValue("A");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // B fires
    act(() => {
      result.current.setValue("B");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // ─── Resolve B first (out of order) ───
    await act(async () => {
      saveB.resolve();
      await saveB.promise;
      await flushMicrotasks();
    });

    // Intermediate assertion: after B resolves but before A resolves
    expect(result.current.saveState).toBe("saved");

    // ─── Resolve A second (stale) ───
    await act(async () => {
      saveA.resolve();
      await saveA.promise;
      await flushMicrotasks();
    });

    // External assertions after out-of-order resolution completes
    expect(result.current.saveState).toBe("saved");
    // savedValueRef should still be "B" (higher version).
    // Observable side-effect: because current value is "B" and saved is "B",
    // there should be no dirty flag and no draft.
    expect(result.current.dirty).toBe(false);
    expect(localStorage.getItem("test:A15")).toBeNull();

    // ─── Post-condition: dedup map is clean ───
    // A subsequent setValue("A") must NOT be incorrectly deduped.
    act(() => {
      result.current.setValue("A");
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await flushMicrotasks();
    });

    // Third save should have fired
    expect(onSave).toHaveBeenCalledTimes(3);
    expect(onSave).toHaveBeenLastCalledWith("A");
  });
});
