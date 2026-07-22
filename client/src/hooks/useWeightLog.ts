/**
 * useWeightLog — persists weight entries to localStorage
 * Each entry: { id, date (YYYY-MM-DD), weightLbs, loggedAt (ISO) }
 */
import { useState, useCallback, useMemo } from "react";

export interface WeightEntry {
  id: string;
  date: string;       // YYYY-MM-DD
  weightLbs: number;
  loggedAt: string;   // ISO timestamp
}

const STORAGE_KEY = "eatvera-weight-log";

function loadEntries(): WeightEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WeightEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: WeightEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota errors
  }
}

export function useWeightLog() {
  const [entries, setEntries] = useState<WeightEntry[]>(() => loadEntries());

  const addEntry = useCallback((weightLbs: number, date?: string) => {
    const iso = date ?? new Date().toISOString().split("T")[0];
    const newEntry: WeightEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: iso,
      weightLbs,
      loggedAt: new Date().toISOString(),
    };
    setEntries(prev => {
      // Replace existing entry for the same date
      const filtered = prev.filter(e => e.date !== iso);
      const updated = [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      saveEntries(updated);
      return updated;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveEntries(updated);
      return updated;
    });
  }, []);

  // Sorted ascending by date (for chart)
  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  // Most recent entry
  const latestEntry = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1] : null;

  return { entries: sortedEntries, latestEntry, addEntry, removeEntry };
}
