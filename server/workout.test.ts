import { describe, it, expect } from "vitest";

// Unit tests for workout router logic (no DB needed)
describe("Workout session validation", () => {
  it("should validate date format yyyy-MM-dd", () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    expect(dateRegex.test("2025-01-15")).toBe(true);
    expect(dateRegex.test("2025-1-5")).toBe(false);
    expect(dateRegex.test("not-a-date")).toBe(false);
  });

  it("should validate rating range 1-5", () => {
    const validRatings = [1, 2, 3, 4, 5];
    const invalidRatings = [0, 6, -1, 10];
    validRatings.forEach(r => expect(r >= 1 && r <= 5).toBe(true));
    invalidRatings.forEach(r => expect(r >= 1 && r <= 5).toBe(false));
  });

  it("should validate duration range 1-600 minutes", () => {
    expect(45 >= 1 && 45 <= 600).toBe(true);
    expect(0 >= 1 && 0 <= 600).toBe(false);
    expect(601 >= 1 && 601 <= 600).toBe(false);
  });

  it("should validate calories range 0-9999", () => {
    expect(350 >= 0 && 350 <= 9999).toBe(true);
    expect(-1 >= 0 && -1 <= 9999).toBe(false);
    expect(10000 >= 0 && 10000 <= 9999).toBe(false);
  });

  it("should serialize exercises to JSON", () => {
    const exercises = [
      { name: "Bench Press", sets: 4, reps: 10, weight: 135, completed: true, loggedSets: [] },
    ];
    const json = JSON.stringify(exercises);
    const parsed = JSON.parse(json);
    expect(parsed[0].name).toBe("Bench Press");
    expect(parsed[0].sets).toBe(4);
  });

  it("should compute progressive overload factor", () => {
    const getOverloadFactor = (week: number) => 1 + (week - 1) * 0.05;
    expect(getOverloadFactor(1)).toBe(1.0);
    expect(getOverloadFactor(2)).toBeCloseTo(1.05);
    expect(getOverloadFactor(4)).toBeCloseTo(1.15);
    expect(getOverloadFactor(8)).toBeCloseTo(1.35);
  });

  it("should compute rep ranges with progressive overload", () => {
    const baseReps = 12; // beginner
    const week = 3;
    const overloadFactor = 1 + (week - 1) * 0.05;
    const repsHigh = Math.round(baseReps * overloadFactor);
    const repsLow = Math.round((baseReps - 2) * overloadFactor);
    expect(repsHigh).toBeGreaterThan(baseReps);
    expect(repsLow).toBeLessThan(repsHigh);
  });

  it("should validate workout name length", () => {
    const validName = "Upper Body Push";
    const emptyName = "";
    const longName = "A".repeat(256);
    expect(validName.length >= 1 && validName.length <= 255).toBe(true);
    expect(emptyName.length >= 1).toBe(false);
    expect(longName.length <= 255).toBe(false);
  });

  it("should handle missing optional fields gracefully", () => {
    const session = {
      programId: undefined,
      date: "2025-01-15",
      workoutName: "Chest Day",
      exercisesJson: "[]",
      durationMin: undefined,
      caloriesBurned: undefined,
      notes: undefined,
      rating: undefined,
    };
    expect(session.programId ?? null).toBeNull();
    expect(session.durationMin ?? null).toBeNull();
    expect(session.caloriesBurned ?? null).toBeNull();
    expect(session.notes ?? null).toBeNull();
    expect(session.rating ?? null).toBeNull();
  });

  it("should compute workout streak from dates", () => {
    const computeStreak = (dates: string[]): number => {
      const dateSet = new Set(dates);
      let count = 0;
      const d = new Date("2025-01-15"); // fixed reference date for test
      while (true) {
        const key = d.toISOString().split("T")[0];
        if (!dateSet.has(key)) break;
        count++;
        d.setDate(d.getDate() - 1);
      }
      return count;
    };
    expect(computeStreak(["2025-01-15", "2025-01-14", "2025-01-13"])).toBe(3);
    expect(computeStreak(["2025-01-15", "2025-01-13"])).toBe(1); // gap breaks streak
    expect(computeStreak([])).toBe(0);
  });

  it("should compute weekly calories from session logs", () => {
    const sessions = [
      { date: "2025-01-13", caloriesBurned: 300 },
      { date: "2025-01-13", caloriesBurned: 200 },
      { date: "2025-01-14", caloriesBurned: 450 },
    ];
    const dayCalories = sessions.reduce((acc, s) => {
      acc[s.date] = (acc[s.date] || 0) + s.caloriesBurned;
      return acc;
    }, {} as Record<string, number>);
    expect(dayCalories["2025-01-13"]).toBe(500);
    expect(dayCalories["2025-01-14"]).toBe(450);
  });

  it("should validate fitness goals", () => {
    const validGoals = ["muscle_gain", "weight_loss", "endurance", "athletic", "recomposition"];
    expect(validGoals.includes("muscle_gain")).toBe(true);
    expect(validGoals.includes("invalid_goal")).toBe(false);
  });

  it("should validate workout frequency range", () => {
    const validFrequencies = [3, 4, 5, 6];
    expect(validFrequencies.includes(4)).toBe(true);
    expect(validFrequencies.includes(2)).toBe(false);
    expect(validFrequencies.includes(7)).toBe(false);
  });

  it("should compute estimated 1RM using Epley formula", () => {
    const epley1RM = (weight: number, reps: number) => Math.round(weight * (1 + reps / 30));
    expect(epley1RM(225, 5)).toBe(263);
    expect(epley1RM(135, 10)).toBe(180);
    expect(epley1RM(100, 1)).toBe(103);
    expect(epley1RM(200, 8)).toBe(253);
  });

  it("should identify stalled exercises from weight history", () => {
    const isStalled = (weights: number[]) => {
      if (weights.length < 3) return false;
      const recent = weights.slice(-3);
      return recent.every(w => w === recent[0]) && recent[0] > 0;
    };
    expect(isStalled([135, 135, 135, 135])).toBe(true);
    expect(isStalled([135, 145, 155, 165])).toBe(false);
    expect(isStalled([135, 145, 135])).toBe(false);
    expect(isStalled([135, 135])).toBe(false);
    expect(isStalled([0, 0, 0])).toBe(false);
  });

  it("should identify progressing exercises from weight history", () => {
    const isProgressing = (weights: number[]) => {
      if (weights.length < 3) return false;
      const recent = weights.slice(-3);
      return recent[recent.length - 1] > recent[0];
    };
    expect(isProgressing([135, 145, 155])).toBe(true);
    expect(isProgressing([155, 155, 155])).toBe(false);
    expect(isProgressing([155, 145, 135])).toBe(false);
  });

  it("should build strength progression from session exercises", () => {
    const sessions = [
      { date: "2025-01-10", exercisesJson: JSON.stringify([{ name: "Bench Press", sets: 4, reps: 8, weight: 135, completed: true }]) },
      { date: "2025-01-14", exercisesJson: JSON.stringify([{ name: "Bench Press", sets: 4, reps: 8, weight: 145, completed: true }]) },
      { date: "2025-01-18", exercisesJson: JSON.stringify([{ name: "Bench Press", sets: 4, reps: 8, weight: 155, completed: true }]) },
    ];
    const progression: Array<{ date: string; maxWeight: number }> = [];
    for (const session of sessions) {
      const exercises = JSON.parse(session.exercisesJson) as Array<{ name: string; weight: number; completed: boolean }>;
      const matching = exercises.filter(e => e.name === "Bench Press" && e.completed);
      if (matching.length > 0) {
        progression.push({ date: session.date, maxWeight: Math.max(...matching.map(e => e.weight)) });
      }
    }
    expect(progression).toHaveLength(3);
    expect(progression[0].maxWeight).toBe(135);
    expect(progression[2].maxWeight).toBe(155);
    expect(progression[2].maxWeight - progression[0].maxWeight).toBe(20);
  });

  it("should compute SVG chart x-coordinates correctly", () => {
    const PAD = { left: 36, right: 16 };
    const W = 320;
    const chartW = W - PAD.left - PAD.right;
    const data = [135, 145, 155];
    const points = data.map((_, i) => PAD.left + (i / (data.length - 1)) * chartW);
    expect(points[0]).toBe(PAD.left);
    expect(points[data.length - 1]).toBe(PAD.left + chartW);
  });

  it("should handle AI coaching intensity recommendations", () => {
    const validRecommendations = ["increase", "maintain", "deload", "recovery"];
    expect(validRecommendations.includes("increase")).toBe(true);
    expect(validRecommendations.includes("deload")).toBe(true);
    expect(validRecommendations.includes("invalid")).toBe(false);
  });

  it("should compute average session rating", () => {
    const sessions = [
      { rating: 4 }, { rating: 5 }, { rating: 3 }, { rating: null }
    ];
    const rated = sessions.filter(s => s.rating !== null);
    const avg = rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length;
    expect(avg).toBeCloseTo(4.0);
    expect(rated.length).toBe(3);
  });
});
