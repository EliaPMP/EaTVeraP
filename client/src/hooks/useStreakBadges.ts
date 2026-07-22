/**
 * useStreakBadges — computes logging streaks and unlocked achievement badges
 * from the calorie scanner meal log (localStorage).
 */
import { useMemo } from "react";
import { useCalorieGoals } from "./useCalorieGoals";

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface StreakInfo {
  currentStreak: number;   // consecutive days with at least 1 meal logged
  longestStreak: number;
  totalDaysLogged: number;
  totalMealsLogged: number;
  loggedToday: boolean;
}

const BADGE_DEFINITIONS: Omit<Badge, "unlocked" | "unlockedAt">[] = [
  // Logging milestones
  { id: "first_meal", emoji: "🍽️", name: "First Bite", description: "Log your first meal", tier: "bronze" },
  { id: "meals_5", emoji: "⭐", name: "Getting Started", description: "Log 5 meals total", tier: "bronze" },
  { id: "meals_10", emoji: "🔥", name: "On a Roll", description: "Log 10 meals total", tier: "bronze" },
  { id: "meals_25", emoji: "💪", name: "Committed", description: "Log 25 meals total", tier: "silver" },
  { id: "meals_50", emoji: "🏅", name: "Dedicated", description: "Log 50 meals total", tier: "silver" },
  { id: "meals_100", emoji: "🏆", name: "Nutrition Master", description: "Log 100 meals total", tier: "gold" },
  // Streak milestones
  { id: "streak_3", emoji: "🌱", name: "3-Day Streak", description: "Log meals 3 days in a row", tier: "bronze" },
  { id: "streak_7", emoji: "🌿", name: "Week Warrior", description: "Log meals 7 days in a row", tier: "silver" },
  { id: "streak_14", emoji: "🌳", name: "Two-Week Champion", description: "Log meals 14 days in a row", tier: "gold" },
  { id: "streak_30", emoji: "💎", name: "Monthly Legend", description: "Log meals 30 days in a row", tier: "platinum" },
  // Quality milestones
  { id: "quality_first_80", emoji: "🥗", name: "Clean Eater", description: "Log a meal with quality score ≥ 80", tier: "bronze" },
  { id: "quality_avg_70", emoji: "🌟", name: "Quality Conscious", description: "Maintain a 7-day average quality score ≥ 70", tier: "silver" },
  { id: "quality_perfect", emoji: "✨", name: "Perfection", description: "Log a meal with a perfect quality score of 100", tier: "gold" },
  // Calorie goal milestones
  { id: "goal_met_1", emoji: "🎯", name: "On Target", description: "Stay within your calorie goal for 1 day", tier: "bronze" },
  { id: "goal_met_7", emoji: "🏹", name: "Sharpshooter", description: "Stay within your calorie goal 7 days total", tier: "silver" },
];

const BADGES_KEY = "eatclean-badges";

function loadUnlockedBadges(): Record<string, string> {
  try {
    const stored = localStorage.getItem(BADGES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveUnlockedBadges(badges: Record<string, string>) {
  try {
    localStorage.setItem(BADGES_KEY, JSON.stringify(badges));
  } catch {}
}

export function useStreakBadges() {
  const { mealLog, goals, last7Days } = useCalorieGoals();

  const streakInfo = useMemo<StreakInfo>(() => {
    if (mealLog.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalDaysLogged: 0, totalMealsLogged: 0, loggedToday: false };
    }

    // Get unique days with at least 1 meal
    const daySet = new Set(mealLog.map(e => new Date(e.analyzedAt).toDateString()));
    const totalDaysLogged = daySet.size;
    const totalMealsLogged = mealLog.length;
    const todayStr = new Date().toDateString();
    const loggedToday = daySet.has(todayStr);

    // Compute current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    const checkDate = new Date();
    // If not logged today, start checking from yesterday
    if (!loggedToday) checkDate.setDate(checkDate.getDate() - 1);
    while (daySet.has(checkDate.toDateString())) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Compute longest streak
    const allDays = Array.from(daySet)
      .map(d => new Date(d).getTime())
      .sort((a, b) => a - b);

    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < allDays.length; i++) {
      const diff = (allDays[i] - allDays[i - 1]) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }
    if (allDays.length === 1) longestStreak = 1;
    longestStreak = Math.max(longestStreak, currentStreak);

    return { currentStreak, longestStreak, totalDaysLogged, totalMealsLogged, loggedToday };
  }, [mealLog]);

  const badges = useMemo<Badge[]>(() => {
    const unlocked = loadUnlockedBadges();
    const now = new Date().toISOString();

    // Determine which badges should be unlocked
    const shouldUnlock = new Set<string>();

    if (streakInfo.totalMealsLogged >= 1) shouldUnlock.add("first_meal");
    if (streakInfo.totalMealsLogged >= 5) shouldUnlock.add("meals_5");
    if (streakInfo.totalMealsLogged >= 10) shouldUnlock.add("meals_10");
    if (streakInfo.totalMealsLogged >= 25) shouldUnlock.add("meals_25");
    if (streakInfo.totalMealsLogged >= 50) shouldUnlock.add("meals_50");
    if (streakInfo.totalMealsLogged >= 100) shouldUnlock.add("meals_100");

    if (streakInfo.longestStreak >= 3) shouldUnlock.add("streak_3");
    if (streakInfo.longestStreak >= 7) shouldUnlock.add("streak_7");
    if (streakInfo.longestStreak >= 14) shouldUnlock.add("streak_14");
    if (streakInfo.longestStreak >= 30) shouldUnlock.add("streak_30");

    const maxQuality = mealLog.reduce((m, e) => Math.max(m, e.analysis.qualityScore), 0);
    if (maxQuality >= 80) shouldUnlock.add("quality_first_80");
    if (maxQuality >= 100) shouldUnlock.add("quality_perfect");

    const weeklyScores = last7Days.filter(d => d.mealCount > 0).map(d => d.avgQuality);
    if (weeklyScores.length >= 7) {
      const weekAvg = weeklyScores.reduce((a, b) => a + b, 0) / weeklyScores.length;
      if (weekAvg >= 70) shouldUnlock.add("quality_avg_70");
    }

    // Calorie goal: check days where calories were within goal
    const CALORIE_LOG_KEY = "eatclean-calorie-goals";
    let goalMetDays = 0;
    try {
      const goalStored = localStorage.getItem(CALORIE_LOG_KEY);
      const savedGoals = goalStored ? JSON.parse(goalStored) : null;
      const dailyGoal = savedGoals?.dailyCalories || goals.dailyCalories;
      last7Days.forEach(d => {
        if (d.calories > 0 && d.calories <= dailyGoal) goalMetDays++;
      });
    } catch {}
    if (goalMetDays >= 1) shouldUnlock.add("goal_met_1");
    if (goalMetDays >= 7) shouldUnlock.add("goal_met_7");

    // Persist newly unlocked badges
    let changed = false;
    shouldUnlock.forEach(id => {
      if (!unlocked[id]) {
        unlocked[id] = now;
        changed = true;
      }
    });
    if (changed) saveUnlockedBadges(unlocked);

    return BADGE_DEFINITIONS.map(def => ({
      ...def,
      unlocked: shouldUnlock.has(def.id),
      unlockedAt: unlocked[def.id],
    }));
  }, [mealLog, streakInfo, last7Days, goals.dailyCalories]);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const recentBadges = badges.filter(b => b.unlocked).slice(-3);

  return { streakInfo, badges, unlockedCount, recentBadges };
}
