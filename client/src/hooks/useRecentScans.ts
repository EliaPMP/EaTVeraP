/**
 * useRecentScans — persists the last 10 scanned barcodes in localStorage.
 * Each entry stores the barcode, product name, brand, health score, image URL, and scan timestamp.
 */

import { useState, useCallback } from "react";

export interface RecentScan {
  barcode: string;
  productName: string | null;
  brand: string | null;
  healthScore: number | null;
  imageUrl: string | null;
  scannedAt: number; // Unix timestamp ms
}

const STORAGE_KEY = "eatvera_recent_scans";
const MAX_RECENT = 10;

function loadFromStorage(): RecentScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentScan[];
  } catch {
    return [];
  }
}

function saveToStorage(scans: RecentScan[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function useRecentScans() {
  const [recentScans, setRecentScans] = useState<RecentScan[]>(() => loadFromStorage());

  /**
   * Add or update a scan entry. If the barcode already exists it is moved to the top.
   */
  const addScan = useCallback((scan: Omit<RecentScan, "scannedAt">) => {
    setRecentScans((prev) => {
      // Remove existing entry for this barcode (dedup)
      const filtered = prev.filter((s) => s.barcode !== scan.barcode);
      const updated: RecentScan[] = [
        { ...scan, scannedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  /**
   * Remove a single scan by barcode.
   */
  const removeScan = useCallback((barcode: string) => {
    setRecentScans((prev) => {
      const updated = prev.filter((s) => s.barcode !== barcode);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  /**
   * Clear all recent scans.
   */
  const clearAll = useCallback(() => {
    saveToStorage([]);
    setRecentScans([]);
  }, []);

  return { recentScans, addScan, removeScan, clearAll };
}
