/**
 * useSavedSwaps — persist bookmarked alternative swaps to localStorage.
 * Each saved swap stores the full Alternative object plus the name of the
 * product it was shown against, so the "Saved Swaps" page can show context.
 */

import { useState, useCallback, useEffect } from "react";
import type { Alternative } from "@/lib/alternativesEngine";

const STORAGE_KEY = "eatvera_saved_swaps";

export interface SavedSwap {
  alt: Alternative;
  /** Name of the scanned product this alternative was shown for */
  scannedProductName: string;
  /** Score of the scanned product */
  scannedProductScore: number;
  /** Unix ms timestamp when saved */
  savedAt: number;
}

function load(): SavedSwap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedSwap[]) : [];
  } catch {
    return [];
  }
}

function persist(swaps: SavedSwap[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(swaps));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function useSavedSwaps() {
  const [swaps, setSwaps] = useState<SavedSwap[]>(load);

  // Keep state in sync if another tab changes localStorage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSwaps(load());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isSaved = useCallback(
    (altId: string) => swaps.some((s) => s.alt.id === altId),
    [swaps]
  );

  const save = useCallback(
    (alt: Alternative, scannedProductName: string, scannedProductScore: number) => {
      setSwaps((prev) => {
        if (prev.some((s) => s.alt.id === alt.id)) return prev; // already saved
        const next = [
          { alt, scannedProductName, scannedProductScore, savedAt: Date.now() },
          ...prev,
        ];
        persist(next);
        return next;
      });
    },
    []
  );

  const remove = useCallback((altId: string) => {
    setSwaps((prev) => {
      const next = prev.filter((s) => s.alt.id !== altId);
      persist(next);
      return next;
    });
  }, []);

  const toggle = useCallback(
    (alt: Alternative, scannedProductName: string, scannedProductScore: number) => {
      if (isSaved(alt.id)) {
        remove(alt.id);
      } else {
        save(alt, scannedProductName, scannedProductScore);
      }
    },
    [isSaved, remove, save]
  );

  const clearAll = useCallback(() => {
    persist([]);
    setSwaps([]);
  }, []);

  return { swaps, isSaved, save, remove, toggle, clearAll };
}
