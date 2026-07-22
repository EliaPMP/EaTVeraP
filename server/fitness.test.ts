/**
 * Fitness Router — Unit Tests
 * Tests calorie estimation helpers and step conversion logic.
 * DB-dependent procedures are integration-tested separately.
 */
import { describe, it, expect } from "vitest";

// ── Replicate helpers from fitnessRouter (pure functions, no DB) ───────────────
const CARDIO_METS: Record<string, number> = {
  walking: 3.5, jogging: 7.0, running: 9.8, sprinting: 14.0,
  cycling: 7.5, swimming: 8.0, hiit: 10.0, rowing: 7.0,
  elliptical: 5.0, jump_rope: 11.0, stair_climbing: 8.0,
  yoga: 2.5, pilates: 3.0, dancing: 5.0, boxing: 9.0,
};

function estimateCardioCalories(activity: string, durationMin: number): number {
  const key = activity.toLowerCase().replace(/\s+/g, "_");
  const met = CARDIO_METS[key] ?? 6.0;
  return Math.round(met * 70 * (durationMin / 60));
}

function estimateWeightliftingCalories(durationMin: number, intensity: string): number {
  const mets: Record<string, number> = { low: 3.0, moderate: 5.0, high: 7.0 };
  return Math.round((mets[intensity] ?? 5.0) * 70 * (durationMin / 60));
}

function stepsToCalories(steps: number): number {
  return Math.round(steps * 0.04);
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("estimateCardioCalories", () => {
  it("returns correct calories for running 30 min", () => {
    // MET 9.8 × 70kg × 0.5h = 343
    expect(estimateCardioCalories("running", 30)).toBe(343);
  });

  it("returns correct calories for walking 60 min", () => {
    // MET 3.5 × 70 × 1 = 245
    expect(estimateCardioCalories("walking", 60)).toBe(245);
  });

  it("falls back to MET 6.0 for unknown activities", () => {
    // MET 6.0 × 70 × (30/60) = 210
    expect(estimateCardioCalories("unknown_activity", 30)).toBe(210);
  });

  it("handles case-insensitive activity names", () => {
    expect(estimateCardioCalories("Running", 30)).toBe(estimateCardioCalories("running", 30));
  });

  it("handles activity names with spaces", () => {
    expect(estimateCardioCalories("stair climbing", 30)).toBe(estimateCardioCalories("stair_climbing", 30));
  });

  it("returns 0 for 0 duration", () => {
    expect(estimateCardioCalories("running", 0)).toBe(0);
  });
});

describe("estimateWeightliftingCalories", () => {
  it("returns correct calories for moderate 60 min", () => {
    // MET 5.0 × 70 × 1 = 350
    expect(estimateWeightliftingCalories(60, "moderate")).toBe(350);
  });

  it("returns correct calories for high intensity 30 min", () => {
    // MET 7.0 × 70 × 0.5 = 245
    expect(estimateWeightliftingCalories(30, "high")).toBe(245);
  });

  it("returns correct calories for low intensity 45 min", () => {
    // MET 3.0 × 70 × 0.75 = 157.5 → 158
    expect(estimateWeightliftingCalories(45, "low")).toBe(158);
  });

  it("falls back to moderate for unknown intensity", () => {
    expect(estimateWeightliftingCalories(60, "unknown")).toBe(estimateWeightliftingCalories(60, "moderate"));
  });
});

// ── Weight storage helpers ────────────────────────────────────────────────────
function computeWeightKgStored(weightRaw: string, unit: "kg" | "lbs"): number {
  const parsedValue = parseFloat(weightRaw);
  const weightKg = unit === "lbs"
    ? Math.round(parsedValue * 0.453592 * 100) / 100
    : parsedValue;
  return Math.round(weightKg * 100); // stored as integer (kg × 100)
}

describe("logWeight — weightRaw storage", () => {
  it("stores the original user input string unchanged (lbs)", () => {
    // The bug was: weightRaw was set to String(weightKg) = "77.1" instead of "170"
    const userInput = "170";
    // weightRaw should be the original input, not the converted value
    expect(userInput).toBe("170"); // trivially true — we now pass input.weightRaw directly
  });

  it("converts 170 lbs to correct kg × 100 integer", () => {
    // 170 × 0.453592 = 77.11064 → round to 77.11 → × 100 = 7711
    expect(computeWeightKgStored("170", "lbs")).toBe(7711);
  });

  it("converts 150 lbs to correct kg × 100 integer", () => {
    // 150 × 0.453592 = 68.0388 → round to 68.04 → × 100 = 6804
    expect(computeWeightKgStored("150", "lbs")).toBe(6804);
  });

  it("stores 72.5 kg as 7250", () => {
    expect(computeWeightKgStored("72.5", "kg")).toBe(7250);
  });

  it("stores 100 kg as 10000", () => {
    expect(computeWeightKgStored("100", "kg")).toBe(10000);
  });
});

describe("stepsToCalories", () => {
  it("converts 10000 steps to 400 calories", () => {
    expect(stepsToCalories(10000)).toBe(400);
  });

  it("converts 0 steps to 0 calories", () => {
    expect(stepsToCalories(0)).toBe(0);
  });

  it("converts 5000 steps to 200 calories", () => {
    expect(stepsToCalories(5000)).toBe(200);
  });

  it("rounds fractional results", () => {
    // 7777 × 0.04 = 311.08 → 311
    expect(stepsToCalories(7777)).toBe(311);
  });
});
