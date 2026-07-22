import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Unit tests for mealSuggestionsRouter logic ──────────────────────────────

describe("Meal Suggestions - macro focus logic", () => {
  function getMacroFocus(consumed: { protein: number; carbs: number; fat: number }, goals: { dailyProtein: number; dailyCarbs: number; dailyFat: number }) {
    const proteinPct = consumed.protein / goals.dailyProtein;
    const carbsPct = consumed.carbs / goals.dailyCarbs;
    const fatPct = consumed.fat / goals.dailyFat;

    if (proteinPct < carbsPct && proteinPct < fatPct) return "high-protein";
    if (carbsPct < proteinPct && carbsPct < fatPct) return "higher-carb";
    if (fatPct < proteinPct && fatPct < carbsPct) return "healthy-fat";
    return "balanced";
  }

  const goals = { dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 };

  it("returns high-protein when protein percentage is lowest", () => {
    const consumed = { protein: 10, carbs: 100, fat: 30 };
    expect(getMacroFocus(consumed, goals)).toBe("high-protein");
  });

  it("returns higher-carb when carbs percentage is lowest", () => {
    const consumed = { protein: 100, carbs: 10, fat: 40 };
    expect(getMacroFocus(consumed, goals)).toBe("higher-carb");
  });

  it("returns healthy-fat when fat percentage is lowest", () => {
    const consumed = { protein: 100, carbs: 150, fat: 5 };
    expect(getMacroFocus(consumed, goals)).toBe("healthy-fat");
  });

  it("returns balanced when all macros are equal percentage", () => {
    const consumed = { protein: 75, carbs: 100, fat: 32.5 };
    expect(getMacroFocus(consumed, goals)).toBe("balanced");
  });
});

describe("Remaining macro calculation", () => {
  function getRemaining(consumed: { calories: number; protein: number; carbs: number; fat: number }, goals: { dailyCalories: number; dailyProtein: number; dailyCarbs: number; dailyFat: number }) {
    return {
      calories: Math.max(0, goals.dailyCalories - consumed.calories),
      protein: Math.max(0, goals.dailyProtein - consumed.protein),
      carbs: Math.max(0, goals.dailyCarbs - consumed.carbs),
      fat: Math.max(0, goals.dailyFat - consumed.fat),
    };
  }

  const goals = { dailyCalories: 2000, dailyProtein: 150, dailyCarbs: 200, dailyFat: 65 };

  it("calculates remaining correctly when under goal", () => {
    const consumed = { calories: 800, protein: 60, carbs: 80, fat: 25 };
    const remaining = getRemaining(consumed, goals);
    expect(remaining.calories).toBe(1200);
    expect(remaining.protein).toBe(90);
    expect(remaining.carbs).toBe(120);
    expect(remaining.fat).toBe(40);
  });

  it("clamps remaining to 0 when over goal", () => {
    const consumed = { calories: 2500, protein: 200, carbs: 300, fat: 100 };
    const remaining = getRemaining(consumed, goals);
    expect(remaining.calories).toBe(0);
    expect(remaining.protein).toBe(0);
    expect(remaining.carbs).toBe(0);
    expect(remaining.fat).toBe(0);
  });

  it("handles zero consumption", () => {
    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const remaining = getRemaining(consumed, goals);
    expect(remaining.calories).toBe(2000);
    expect(remaining.protein).toBe(150);
  });
});

describe("Daily calorie progress calculation", () => {
  function getProgress(consumed: number, goal: number) {
    return Math.min(1, consumed / goal);
  }

  it("returns 0 when no calories consumed", () => {
    expect(getProgress(0, 2000)).toBe(0);
  });

  it("returns 0.5 when halfway to goal", () => {
    expect(getProgress(1000, 2000)).toBe(0.5);
  });

  it("returns 1 when at goal", () => {
    expect(getProgress(2000, 2000)).toBe(1);
  });

  it("clamps to 1 when over goal", () => {
    expect(getProgress(2500, 2000)).toBe(1);
  });
});

describe("Weekly calorie averages", () => {
  it("calculates average correctly for 7 days", () => {
    const days = [1500, 2000, 1800, 2200, 1600, 1900, 2100];
    const avg = Math.round(days.reduce((a, b) => a + b, 0) / 7);
    expect(avg).toBe(1871);
  });

  it("returns 0 for days with no data", () => {
    const days = [0, 0, 0, 0, 0, 0, 0];
    const avg = Math.round(days.reduce((a, b) => a + b, 0) / 7);
    expect(avg).toBe(0);
  });
});
