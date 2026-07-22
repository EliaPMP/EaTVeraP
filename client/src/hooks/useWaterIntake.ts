/**
 * useWaterIntake — tracks daily water intake in localStorage.
 * Key: eatvera-water-YYYY-MM-DD  →  number (cups consumed that day)
 * Goal key: eatvera-water-goal-cups  →  number
 */
import { useState, useEffect, useCallback } from "react";

export const ML_PER_CUP = 237; // 8 fl oz

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayStr() {
  return isoDate(new Date());
}

function storageKey(dateStr: string) {
  return `eatvera-water-${dateStr}`;
}

export function loadGoalCups(): number {
  try {
    const stored = localStorage.getItem("eatvera-water-goal-cups");
    return stored ? parseInt(stored, 10) : 8;
  } catch {
    return 8;
  }
}

export function saveGoalCups(cups: number) {
  try {
    localStorage.setItem("eatvera-water-goal-cups", String(cups));
  } catch {}
}

function loadCupsForDate(dateStr: string): number {
  try {
    const stored = localStorage.getItem(storageKey(dateStr));
    if (!stored) return 0;
    const parsed = JSON.parse(stored);
    return typeof parsed === "number" ? parsed : (parsed?.cups ?? 0);
  } catch {
    return 0;
  }
}

function saveCupsForDate(dateStr: string, cups: number) {
  try {
    localStorage.setItem(storageKey(dateStr), JSON.stringify(cups));
  } catch {}
}

export interface WaterDayData {
  date: string;       // YYYY-MM-DD
  dayLabel: string;   // "Mon", "Tue", etc.
  cups: number;
  goalCups: number;
  isToday: boolean;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Build 7-day array for a given weekOffset (0 = current week ending today, -1 = last week, etc.) */
export function buildWeekData(goal: number, weekOffset = 0): WaterDayData[] {
  const today = new Date();
  const todayISO = isoDate(today);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i) + weekOffset * 7);
    const dateStr = isoDate(d);
    return {
      date: dateStr,
      dayLabel: DAY_LABELS[d.getDay()],
      cups: loadCupsForDate(dateStr),
      goalCups: goal,
      isToday: dateStr === todayISO,
    };
  });
}

function computeWaterStreak(goal: number): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = isoDate(d);
    const cups = loadCupsForDate(dateStr);
    if (cups >= goal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function useWaterIntake() {
  const [cups, setCups] = useState<number>(() => loadCupsForDate(todayStr()));
  const [goalCups, setGoalCupState] = useState<number>(loadGoalCups);
  const [last7Days, setLast7Days] = useState<WaterDayData[]>(() => buildWeekData(loadGoalCups(), 0));
  const [waterStreak, setWaterStreak] = useState<number>(() => computeWaterStreak(loadGoalCups()));

  function refreshAll(goal: number) {
    setLast7Days(buildWeekData(goal, 0));
    setWaterStreak(computeWaterStreak(goal));
    setCups(loadCupsForDate(todayStr()));
  }

  useEffect(() => {
    refreshAll(goalCups);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCup = useCallback(() => {
    const goal = loadGoalCups();
    setCups(prev => {
      const next = prev + 1;
      saveCupsForDate(todayStr(), next);
      refreshAll(goal);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeCup = useCallback(() => {
    const goal = loadGoalCups();
    setCups(prev => {
      const next = Math.max(0, prev - 1);
      saveCupsForDate(todayStr(), next);
      refreshAll(goal);
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Retroactively set cups for any date */
  const setCupsForDate = useCallback((dateStr: string, newCups: number) => {
    const clamped = Math.max(0, newCups);
    saveCupsForDate(dateStr, clamped);
    const goal = loadGoalCups();
    if (dateStr === todayStr()) {
      setCups(clamped);
    }
    refreshAll(goal);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setGoalCups = useCallback((n: number) => {
    const clamped = Math.max(1, Math.min(20, n));
    setGoalCupState(clamped);
    saveGoalCups(clamped);
    refreshAll(clamped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mlConsumed = cups * ML_PER_CUP;
  const mlGoal = goalCups * ML_PER_CUP;
  const pct = Math.min(mlConsumed / mlGoal, 1);
  const isOnTrack = cups >= goalCups;

  return {
    cups, goalCups, mlConsumed, mlGoal, pct, isOnTrack,
    last7Days, waterStreak,
    addCup, removeCup, setCupsForDate, setGoalCups,
  };
}
