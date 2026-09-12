"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { writeDraft, clearDraft } from "@/lib/drafts";

export type SaveState = "idle" | "saving" | "saved" | "error";

export interface UseAutosaveFieldOptions<T> {
  value: T;
  onSave: (value: T) => Promise<void>;
  debounceMs?: number;
  draftKey?: string;
}

export interface UseAutosaveFieldReturn<T> {
  value: T;
  setValue: (v: T) => void;
  saveState: SaveState;
  dirty: boolean;
  flush: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useAutosaveField<T extends string | number | boolean | null>(
  options: UseAutosaveFieldOptions<T>
): UseAutosaveFieldReturn<T> {
  const { value, onSave, debounceMs = 500, draftKey } = options;

  // ────────────────────────────────────────────────────────────
  // State (rendered)
  // ────────────────────────────────────────────────────────────
  const [localValue, setLocalValue] = useState<T>(value);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [dirty, setDirty] = useState<boolean>(false);

  // ────────────────────────────────────────────────────────────
  // Refs (synchronous, survive re-renders and unmount)
  // ────────────────────────────────────────────────────────────
  const currentValueRef = useRef<T>(value);
  const savedValueRef = useRef<T | null>(null);
  const requestVersionRef = useRef<number>(0);
  const inFlightVersionsRef = useRef<Map<T, number>>(new Map());
  const dirtyRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep onSave in a ref so callbacks don't need it in deps
  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Keep draftKey in a ref too
  const draftKeyRef = useRef(draftKey);
  useEffect(() => {
    draftKeyRef.current = draftKey;
  }, [draftKey]);

  // ────────────────────────────────────────────────────────────
  // saveInternal — the ONLY place onSave is called
  // ────────────────────────────────────────────────────────────
  const saveInternal = useCallback(async (nextValue: T): Promise<void> => {
    // STEP 1: Per-value dedup
    if (inFlightVersionsRef.current.has(nextValue)) {
      return;
    }

    // STEP 2: Capture version BEFORE await
    const version = ++requestVersionRef.current;

    // STEP 3: Register in-flight
    inFlightVersionsRef.current.set(nextValue, version);

    // STEP 4: Update saveState (gated by mount + version)
    if (isMountedRef.current && version === requestVersionRef.current) {
      setSaveState("saving");
    }

    try {
      // STEP 5: Only call site for onSave
      await onSaveRef.current(nextValue);

      // STEP 6: Superseded check
      if (version !== requestVersionRef.current) return;

      // STEP 7: Update savedValueRef (not mount-gated)
      savedValueRef.current = nextValue;

      // STEP 8: Update saveState (mount-gated)
      if (isMountedRef.current) {
        setSaveState("saved");
      }

      // STEP 9: Value match → clear dirty + draft
      if (savedValueRef.current === currentValueRef.current) {
        if (isMountedRef.current) {
          setDirty(false);
        }
        dirtyRef.current = false;

        if (draftKeyRef.current) {
          clearDraft(draftKeyRef.current);
        }
      }
    } catch {
      // STEP 10: Error handling (version-gated)
      if (version !== requestVersionRef.current) return;

      if (isMountedRef.current) {
        setSaveState("error");
      }
      // dirty stays true; draft stays in localStorage
    } finally {
      // STEP 11: Per-value in-flight cleanup
      const registered = inFlightVersionsRef.current.get(nextValue);
      if (registered === version) {
        inFlightVersionsRef.current.delete(nextValue);
      }
    }
  }, []);

  // ────────────────────────────────────────────────────────────
  // setValue
  // ────────────────────────────────────────────────────────────
  const setValue = useCallback(
    (nextValue: T) => {
      // STEP 1: Update current value ref synchronously
      currentValueRef.current = nextValue;

      // STEP 2: Update local state
      setLocalValue(nextValue);

      // STEP 3: Mark dirty
      setDirty(true);
      dirtyRef.current = true;

      // STEP 4: Write draft synchronously
      if (draftKeyRef.current) {
        writeDraft(draftKeyRef.current, nextValue);
      }

      // STEP 5: Reset debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        saveInternal(currentValueRef.current);
      }, debounceMs);
    },
    [debounceMs, saveInternal]
  );

  // ────────────────────────────────────────────────────────────
  // flush
  // ────────────────────────────────────────────────────────────
  const flush = useCallback(async (): Promise<void> => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    await saveInternal(currentValueRef.current);
  }, [saveInternal]);

  // ────────────────────────────────────────────────────────────
  // retry
  // ────────────────────────────────────────────────────────────
  const retry = useCallback(async (): Promise<void> => {
    await saveInternal(currentValueRef.current);
  }, [saveInternal]);

  // ────────────────────────────────────────────────────────────
  // Unmount flush + Strict Mode-safe mount gate
  // ────────────────────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      if (
        dirtyRef.current &&
        currentValueRef.current !== savedValueRef.current
      ) {
        saveInternal(currentValueRef.current).catch(() => {});
      }

      isMountedRef.current = false;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [saveInternal]);

  return {
    value: localValue,
    setValue,
    saveState,
    dirty,
    flush,
    retry,
  };
}
