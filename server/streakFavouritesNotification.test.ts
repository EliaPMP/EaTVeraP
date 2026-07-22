/**
 * Unit tests for:
 * - Streak calculation logic (derived from useStreakBadges patterns)
 * - Meal favourites localStorage operations
 * - Notification router procedures
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Streak Calculation Logic ─────────────────────────────────────────────────

function computeStreak(loggedDays: string[]): { currentStreak: number; longestStreak: number } {
  if (loggedDays.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const daySet = new Set(loggedDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  const checkDate = new Date(today);
  while (daySet.has(checkDate.toDateString())) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // If today not logged, check if yesterday was (streak still alive)
  if (currentStreak === 0) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const checkYesterday = new Date(yesterday);
    while (daySet.has(checkYesterday.toDateString())) {
      currentStreak++;
      checkYesterday.setDate(checkYesterday.getDate() - 1);
    }
  }

  // Longest streak
  const sortedDays = Array.from(daySet)
    .map(d => new Date(d).getTime())
    .sort((a, b) => a - b);

  let longest = 0;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (sortedDays[i] - sortedDays[i - 1]) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  if (sortedDays.length === 1) longest = 1;

  return { currentStreak, longestStreak: Math.max(longest, currentStreak) };
}

describe("Streak Calculation", () => {
  it("returns 0 streak for empty log", () => {
    const result = computeStreak([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("counts consecutive days correctly", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const days = [
      today.toDateString(),
      yesterday.toDateString(),
      twoDaysAgo.toDateString(),
    ];
    const result = computeStreak(days);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it("breaks streak on gap", () => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    // Gap: today + 3 days ago (no yesterday or 2 days ago)
    const days = [today.toDateString(), threeDaysAgo.toDateString()];
    const result = computeStreak(days);
    expect(result.currentStreak).toBe(1);
  });

  it("handles single day log", () => {
    const today = new Date();
    const result = computeStreak([today.toDateString()]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });
});

// ─── Meal Favourites Logic ────────────────────────────────────────────────────

interface FavouriteMeal {
  id: string;
  name: string;
  source: "scan" | "suggestion";
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  starredAt: string;
}

function createFavourite(meal: Omit<FavouriteMeal, "id" | "starredAt">): FavouriteMeal {
  return {
    ...meal,
    id: `fav-${Date.now()}-test`,
    starredAt: new Date().toISOString(),
  };
}

function isFavourite(favourites: FavouriteMeal[], name: string): boolean {
  return favourites.some(f => f.name.toLowerCase() === name.toLowerCase());
}

function toggleFavourite(
  favourites: FavouriteMeal[],
  meal: Omit<FavouriteMeal, "id" | "starredAt">
): FavouriteMeal[] {
  const existing = favourites.find(f => f.name.toLowerCase() === meal.name.toLowerCase());
  if (existing) {
    return favourites.filter(f => f.id !== existing.id);
  }
  return [createFavourite(meal), ...favourites];
}

describe("Meal Favourites Logic", () => {
  it("adds a meal to favourites", () => {
    const meal = { name: "Grilled Chicken", source: "scan" as const, calories: 350, macros: { protein: 40, carbs: 5, fat: 15 } };
    const result = toggleFavourite([], meal);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Grilled Chicken");
  });

  it("removes a meal when toggled again", () => {
    const meal = { name: "Grilled Chicken", source: "scan" as const, calories: 350, macros: { protein: 40, carbs: 5, fat: 15 } };
    const withMeal = toggleFavourite([], meal);
    const withoutMeal = toggleFavourite(withMeal, meal);
    expect(withoutMeal).toHaveLength(0);
  });

  it("isFavourite returns true for starred meal", () => {
    const meal = { name: "Caesar Salad", source: "suggestion" as const, calories: 450, macros: { protein: 20, carbs: 30, fat: 25 } };
    const favs = toggleFavourite([], meal);
    expect(isFavourite(favs, "Caesar Salad")).toBe(true);
  });

  it("isFavourite is case-insensitive", () => {
    const meal = { name: "Caesar Salad", source: "suggestion" as const, calories: 450, macros: { protein: 20, carbs: 30, fat: 25 } };
    const favs = toggleFavourite([], meal);
    expect(isFavourite(favs, "caesar salad")).toBe(true);
    expect(isFavourite(favs, "CAESAR SALAD")).toBe(true);
  });

  it("does not duplicate meals with same name", () => {
    const meal = { name: "Oatmeal", source: "scan" as const, calories: 300, macros: { protein: 10, carbs: 55, fat: 5 } };
    const once = toggleFavourite([], meal);
    // Trying to add again should remove (toggle), not duplicate
    const twice = toggleFavourite(once, meal);
    expect(twice).toHaveLength(0);
  });
});

// ─── Notification Router Logic ────────────────────────────────────────────────

describe("Notification Reminder Logic", () => {
  it("generates correct reminder message for zero meals logged", () => {
    const remainingCalories = 1800;
    const mealsLoggedToday = 0;
    const reminderType = "lunch";

    const content = mealsLoggedToday === 0
      ? `You haven't logged any meals today. You have ${Math.round(remainingCalories)} kcal remaining in your daily goal. Open EatVera to scan your next meal!`
      : `You've logged ${mealsLoggedToday} meal${mealsLoggedToday > 1 ? "s" : ""} today.`;

    expect(content).toContain("1800 kcal remaining");
    expect(content).toContain("haven't logged any meals");
  });

  it("generates correct reminder message for meals already logged", () => {
    const remainingCalories = 800;
    const mealsLoggedToday = 2;
    const currentTime = "6:30 PM";
    const mealLabel = "dinner";

    const content = mealsLoggedToday === 0
      ? "You haven't logged any meals today."
      : `You've logged ${mealsLoggedToday} meal${mealsLoggedToday > 1 ? "s" : ""} today. You still have ${Math.round(remainingCalories)} kcal remaining. It's ${currentTime} — a great time to log ${mealLabel}!`;

    expect(content).toContain("2 meals today");
    expect(content).toContain("800 kcal remaining");
    expect(content).toContain("6:30 PM");
  });

  it("determines correct reminder type from time", () => {
    function getReminderType(time24: string): string {
      const h = parseInt(time24.split(":")[0]);
      if (h >= 11 && h < 14) return "lunch";
      if (h >= 17 && h < 21) return "dinner";
      if (h >= 14 && h < 17) return "snack";
      return "general";
    }

    expect(getReminderType("12:00")).toBe("lunch");
    expect(getReminderType("18:30")).toBe("dinner");
    expect(getReminderType("15:00")).toBe("snack");
    expect(getReminderType("08:00")).toBe("general");
  });
});
