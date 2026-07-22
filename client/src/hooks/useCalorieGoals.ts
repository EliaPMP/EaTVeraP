/**
 * useCalorieGoals — manages daily calorie & macro targets + reads meal log
 * All data persisted in localStorage
 */
import { useState, useEffect, useCallback } from "react";
import { getBodyProfile } from "@/pages/OnboardingPage";
import { calculatePersonalizedGoals } from "@/lib/calorieCalculator";

export interface CalorieGoals {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
}

export interface MealLogEntry {
  id: string;
  imageUrl: string;
  analysis: {
    mealName: string;
    totalCalories: number;
    qualityScore: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
    };
  };
  analyzedAt: string;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

const DEFAULT_GOALS: CalorieGoals = {
  dailyCalories: 2000,
  dailyProtein: 150,
  dailyCarbs: 200,
  dailyFat: 65,
};

const GOALS_KEY = "eatclean-calorie-goals";
const MEAL_LOG_KEY = "eatclean-meal-log";
const GOALS_PERSONALIZED_KEY = "eatclean-goals-personalized";

/** Returns personalized goals from onboarding if available, else DEFAULT_GOALS */
function getInitialGoals(): CalorieGoals {
  try {
    const stored = localStorage.getItem(GOALS_KEY);
    if (stored) return { ...DEFAULT_GOALS, ...JSON.parse(stored) };
    // First time: auto-calculate from onboarding profile
    const profile = getBodyProfile();
    if (profile) {
      const personalized = calculatePersonalizedGoals(profile);
      const goals: CalorieGoals = {
        dailyCalories: personalized.dailyCalories,
        dailyProtein: personalized.dailyProtein,
        dailyCarbs: personalized.dailyCarbs,
        dailyFat: personalized.dailyFat,
      };
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
      localStorage.setItem(GOALS_PERSONALIZED_KEY, "1");
      return goals;
    }
  } catch {}
  return DEFAULT_GOALS;
}

export function isGoalsPersonalized(): boolean {
  return localStorage.getItem(GOALS_PERSONALIZED_KEY) === "1";
}

export function useCalorieGoals() {
  const [goals, setGoalsState] = useState<CalorieGoals>(() => getInitialGoals());

  const [mealLog, setMealLog] = useState<MealLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem(MEAL_LOG_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Listen for storage changes (cross-tab / CalorieScannerPage updates)
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem(MEAL_LOG_KEY);
        if (stored) setMealLog(JSON.parse(stored));
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const saveGoals = useCallback((newGoals: CalorieGoals) => {
    setGoalsState(newGoals);
    localStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
  }, []);

  // Today's entries
  const todayStr = new Date().toDateString();
  const todayEntries = mealLog.filter(
    (e) => new Date(e.analyzedAt).toDateString() === todayStr
  );

  const todayTotals = todayEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.analysis.totalCalories,
      protein: acc.protein + e.analysis.macros.protein,
      carbs: acc.carbs + e.analysis.macros.carbs,
      fat: acc.fat + e.analysis.macros.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const remaining = {
    calories: Math.max(0, goals.dailyCalories - todayTotals.calories),
    protein: Math.max(0, goals.dailyProtein - todayTotals.protein),
    carbs: Math.max(0, goals.dailyCarbs - todayTotals.carbs),
    fat: Math.max(0, goals.dailyFat - todayTotals.fat),
  };

  const progress = {
    calories: Math.min(1, todayTotals.calories / goals.dailyCalories),
    protein: Math.min(1, todayTotals.protein / goals.dailyProtein),
    carbs: Math.min(1, todayTotals.carbs / goals.dailyCarbs),
    fat: Math.min(1, todayTotals.fat / goals.dailyFat),
  };

  // Last 7 days data for weekly report
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const entries = mealLog.filter(
      (e) => new Date(e.analyzedAt).toDateString() === dateStr
    );
    const calories = entries.reduce((s, e) => s + e.analysis.totalCalories, 0);
    const protein = entries.reduce((s, e) => s + e.analysis.macros.protein, 0);
    const carbs = entries.reduce((s, e) => s + e.analysis.macros.carbs, 0);
    const fat = entries.reduce((s, e) => s + e.analysis.macros.fat, 0);
    const fiber = entries.reduce((s, e) => s + (e.analysis.macros.fiber ?? 0), 0);
    const sugar = entries.reduce((s, e) => s + (e.analysis.macros.sugar ?? 0), 0);
    const scores = entries.map((e) => e.analysis.qualityScore);
    return {
      date: d,
      dateStr,
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      mealCount: entries.length,
      avgQuality: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      entries,
    };
  });

  const weeklyAvgCalories = Math.round(
    last7Days.reduce((s, d) => s + d.calories, 0) / 7
  );

  const weeklyTotalMacros = last7Days.reduce(
    (acc, d) => ({
      protein: acc.protein + d.protein,
      carbs: acc.carbs + d.carbs,
      fat: acc.fat + d.fat,
    }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  const allWeeklyEntries = mealLog.filter((e) => {
    const d = new Date(e.analyzedAt);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const bestMeal = allWeeklyEntries.reduce<MealLogEntry | null>(
    (best, e) => (!best || e.analysis.qualityScore > best.analysis.qualityScore ? e : best),
    null
  );
  const worstMeal = allWeeklyEntries.reduce<MealLogEntry | null>(
    (worst, e) => (!worst || e.analysis.qualityScore < worst.analysis.qualityScore ? e : worst),
    null
  );

  return {
    goals,
    saveGoals,
    mealLog,
    todayEntries,
    todayTotals,
    remaining,
    progress,
    last7Days,
    weeklyAvgCalories,
    weeklyTotalMacros,
    bestMeal,
    worstMeal,
    allWeeklyEntries,
  };
}
