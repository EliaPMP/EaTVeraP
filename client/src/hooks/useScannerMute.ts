import { useState, useCallback } from "react";

const STORAGE_KEY = "eatvera_scanner_muted";

export function useScannerMute() {
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { muted, toggleMute };
}

/** Read-only helper — reads the preference without subscribing to state changes */
export function isScannerMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}
