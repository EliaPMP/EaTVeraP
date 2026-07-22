/**
 * useCalorieStreak — computes consecutive days where net calories stayed within goal.
 * "Within goal" means: calories logged > 0 AND calories <= dailyCalorieGoal.
 * Streak counts backward from today (or yesterday if today has no data yet).
 * Also fires one-time celebratory toasts at 3, 7, 14, and 30-day milestones.
 */
import { useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useCalorieGoals } from "./useCalorieGoals";

export interface CalorieStreakInfo {
  /** Consecutive days within calorie goal (ending today or yesterday) */
  currentStreak: number;
  /** Longest ever streak within calorie goal */
  longestStreak: number;
  /** Whether today is already within goal */
  onTrackToday: boolean;
}

const MILESTONES = [
  { days: 3,  emoji: "🌱", label: "3-day calorie streak!" },
  { days: 7,  emoji: "🔥", label: "7-day calorie streak!" },
  { days: 14, emoji: "💪", label: "14-day calorie streak!" },
  { days: 30, emoji: "🏆", label: "30-day calorie streak!" },
] as const;

const MILESTONE_KEY = "eatvera-calorie-streak-milestones";

function loadSeenMilestones(): Set<number> {
  try {
    const stored = localStorage.getItem(MILESTONE_KEY);
    return stored ? new Set<number>(JSON.parse(stored)) : new Set<number>();
  } catch {
    return new Set<number>();
  }
}

function saveSeenMilestones(seen: Set<number>) {
  try {
    localStorage.setItem(MILESTONE_KEY, JSON.stringify(Array.from(seen)));
  } catch {}
}

export function useCalorieStreak(): CalorieStreakInfo {
  const { mealLog, goals } = useCalorieGoals();

  const result = useMemo<CalorieStreakInfo>(() => {
    if (mealLog.length === 0) {
      return { currentStreak: 0, longestStreak: 0, onTrackToday: false };
    }

    const dailyGoal = goals.dailyCalories;

    // Build a map: dateString → total calories
    const dayCalories: Record<string, number> = {};
    mealLog.forEach(e => {
      const key = new Date(e.analyzedAt).toDateString();
      dayCalories[key] = (dayCalories[key] ?? 0) + e.analysis.totalCalories;
    });

    // Is today on track?
    const todayKey = new Date().toDateString();
    const todayCalories = dayCalories[todayKey] ?? 0;
    const onTrackToday = todayCalories > 0 && todayCalories <= dailyGoal;

    // Compute current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    const checkDate = new Date();
    if (!onTrackToday) checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const key = checkDate.toDateString();
      const cal = dayCalories[key] ?? 0;
      if (cal > 0 && cal <= dailyGoal) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Compute longest streak across all history
    const allDayKeys = Object.keys(dayCalories).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let longestStreak = 0;
    let tempStreak = 0;
    let prevTime: number | null = null;

    for (const key of allDayKeys) {
      const cal = dayCalories[key];
      const time = new Date(key).getTime();
      const isWithinGoal = cal > 0 && cal <= dailyGoal;
      const isConsecutive = prevTime !== null && time - prevTime === 86400000;

      if (isWithinGoal && (prevTime === null || isConsecutive)) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else if (isWithinGoal) {
        tempStreak = 1;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
      prevTime = time;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return { currentStreak, longestStreak, onTrackToday };
  }, [mealLog, goals.dailyCalories]);

  // Fire milestone toasts once per milestone threshold
  useEffect(() => {
    const { currentStreak } = result;
    if (currentStreak < 3) return;

    const seen = loadSeenMilestones();
    let changed = false;

    for (const milestone of MILESTONES) {
      if (currentStreak >= milestone.days && !seen.has(milestone.days)) {
        seen.add(milestone.days);
        changed = true;
        // Delay slightly so the toast appears after page render
        const { emoji, label } = milestone;
        setTimeout(() => {
          toast.success(`${emoji} ${label}`, {
            description: "You're on a roll — keep it up!",
            duration: 5000,
          });
        }, 600);
        // Only fire the highest newly reached milestone in one render cycle
        break;
      }
    }

    if (changed) saveSeenMilestones(seen);
  }, [result.currentStreak]); // eslint-disable-line react-hooks/exhaustive-deps

  return result;
}
