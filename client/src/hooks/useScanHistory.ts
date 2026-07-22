/**
 * EatVera — useScanHistory hook
 * Persists scanned products to localStorage and computes stats.
 */

import { useState, useEffect, useCallback } from "react";
import type { FoodProduct } from "@/lib/foodApi";

export interface ScanRecord {
  id: string;
  product: FoodProduct;
  score: number;
  grade: string;
  scannedAt: string; // ISO date string
}

export interface ScanStats {
  totalScans: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  cleanCount: number;   // score >= 70
  cautionCount: number; // score 40-69
  poorCount: number;    // score < 40
  currentStreak: number; // consecutive days with at least one scan
  weeklyAvg: number;
}

const STORAGE_KEY = "eatclean_scan_history";
const MAX_RECORDS = 200;

function loadHistory(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanRecord[];
  } catch {
    return [];
  }
}

function saveHistory(records: ScanRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
  } catch {
    // Storage full — ignore
  }
}

function computeStats(records: ScanRecord[]): ScanStats {
  if (records.length === 0) {
    return { totalScans: 0, averageScore: 0, bestScore: 0, worstScore: 0, cleanCount: 0, cautionCount: 0, poorCount: 0, currentStreak: 0, weeklyAvg: 0 };
  }
  const scores = records.map((r) => r.score);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const best = Math.max(...scores);
  const worst = Math.min(...scores);
  const cleanCount = scores.filter((s) => s >= 70).length;
  const cautionCount = scores.filter((s) => s >= 40 && s < 70).length;
  const poorCount = scores.filter((s) => s < 40).length;

  // Weekly average (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekRecords = records.filter((r) => new Date(r.scannedAt) >= weekAgo);
  const weeklyAvg = weekRecords.length > 0
    ? Math.round(weekRecords.reduce((a, r) => a + r.score, 0) / weekRecords.length)
    : 0;

  // Streak: count consecutive days (going back from today) that have at least one scan
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);
  while (true) {
    const dateStr = checkDate.toDateString();
    const hasScans = records.some((r) => new Date(r.scannedAt).toDateString() === dateStr);
    if (!hasScans) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    if (streak > 365) break;
  }

  return { totalScans: records.length, averageScore: avg, bestScore: best, worstScore: worst, cleanCount, cautionCount, poorCount, currentStreak: streak, weeklyAvg };
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanRecord[]>(() => loadHistory());
  const stats = computeStats(history);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addScan = useCallback((product: FoodProduct, score: number, grade: string) => {
    const record: ScanRecord = {
      id: `${product.barcode || product.name}-${Date.now()}`,
      product,
      score,
      grade,
      scannedAt: new Date().toISOString(),
    };
    setHistory((prev) => {
      // Avoid duplicate consecutive scans of same product within 10 seconds
      if (prev.length > 0 && prev[0].product.barcode === product.barcode) {
        const diff = Date.now() - new Date(prev[0].scannedAt).getTime();
        if (diff < 10000) return prev;
      }
      return [record, ...prev];
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const removeRecord = useCallback((id: string) => {
    setHistory((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { history, stats, addScan, clearHistory, removeRecord };
}
