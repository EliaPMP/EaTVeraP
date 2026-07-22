/**
 * calorieCalculator.ts
 * Calculates personalized daily calorie and macro targets from a BodyProfile.
 * Uses the Mifflin-St Jeor BMR formula with activity factor + goal adjustment.
 * Now supports gender and age fields for more accurate calculations.
 */

import type { BodyProfile } from "@/pages/OnboardingPage";

export interface PersonalizedGoals {
  dailyCalories: number;
  dailyProtein: number;  // grams
  dailyCarbs: number;    // grams
  dailyFat: number;      // grams
  tdee: number;          // maintenance calories
  bmi: number;
  bmiCategory: string;
}

/** Convert lbs to kg */
function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

/** Convert feet+inches to cm */
function heightToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

/** Estimate BMI */
function calcBMI(weightLbs: number, heightFeet: number, heightInches: number): number {
  const weightKg = lbsToKg(weightLbs);
  const heightM = heightToCm(heightFeet, heightInches) / 100;
  return weightKg / (heightM * heightM);
}

function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/**
 * Mifflin-St Jeor BMR with gender support.
 * Male:   10W + 6.25H - 5A + 5
 * Female: 10W + 6.25H - 5A - 161
 * Other/unknown: gender-neutral average (10W + 6.25H - 5A - 78)
 */
function calcBMR(
  weightLbs: number,
  heightFeet: number,
  heightInches: number,
  age: number,
  gender: string,
): number {
  const weightKg = lbsToKg(weightLbs);
  const heightCm = heightToCm(heightFeet, heightInches);
  const a = age || 30;

  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * a + 5;
  } else if (gender === "female") {
    return 10 * weightKg + 6.25 * heightCm - 5 * a - 161;
  } else {
    // gender-neutral average
    return 10 * weightKg + 6.25 * heightCm - 5 * a - 78;
  }
}

/**
 * Activity multiplier based on current build.
 * Athletic/muscular builds tend to be more active.
 */
function activityFactor(currentBuild: string): number {
  switch (currentBuild) {
    case "athletic":
    case "muscular":
      return 1.55; // moderately active
    case "slim":
    case "average":
      return 1.375; // lightly active
    case "skinny_fat":
    case "overweight":
    case "bigger_build":
      return 1.2; // sedentary/lightly active
    default:
      return 1.375;
  }
}

/**
 * Calorie adjustment based on goal/archetype.
 * Deficit for fat loss, surplus for muscle gain, maintenance otherwise.
 */
function goalCalorieAdjustment(mainGoal: string, desiredBuild: string, archetype?: string): number {
  const goal = archetype || mainGoal || desiredBuild;
  if (goal === "lose_fat" || goal === "slim_toned") return -400;
  if (goal === "maintain_muscle_lose_weight" || goal === "recomp") return -250;
  if (goal === "build_muscle" || goal === "bigger_muscular" || goal === "bulk_build_muscle") return +350;
  if (goal === "lean_athletic") return +100;
  if (goal === "performance") return +200;
  return 0; // maintain
}

/**
 * Macro split based on goal.
 * Returns protein (g/lb bodyweight), carb %, fat %.
 */
function macroSplit(mainGoal: string, desiredBuild: string, archetype?: string): { proteinPerLb: number; carbPct: number; fatPct: number } {
  const goal = archetype || mainGoal || desiredBuild;
  if (goal === "build_muscle" || goal === "bigger_muscular" || goal === "bulk_build_muscle") {
    return { proteinPerLb: 0.9, carbPct: 0.45, fatPct: 0.25 };
  }
  if (goal === "lose_fat" || goal === "slim_toned") {
    return { proteinPerLb: 1.0, carbPct: 0.30, fatPct: 0.30 };
  }
  if (goal === "maintain_muscle_lose_weight" || goal === "recomp") {
    return { proteinPerLb: 1.1, carbPct: 0.30, fatPct: 0.30 };
  }
  if (goal === "lean_athletic" || goal === "performance") {
    return { proteinPerLb: 0.85, carbPct: 0.40, fatPct: 0.30 };
  }
  // maintain / clean eating
  return { proteinPerLb: 0.75, carbPct: 0.40, fatPct: 0.30 };
}

export function calculatePersonalizedGoals(profile: BodyProfile): PersonalizedGoals {
  const age = profile.age || 30;
  const gender = profile.gender || "";
  const bmr = calcBMR(profile.currentWeightLbs, profile.heightFeet, profile.heightInches, age, gender);
  const tdee = Math.round(bmr * activityFactor(profile.currentBuild));
  const adjustment = goalCalorieAdjustment(profile.mainGoal, profile.desiredBuild, profile.archetype);
  const dailyCalories = Math.max(1200, Math.round(tdee + adjustment));

  const { proteinPerLb, carbPct, fatPct } = macroSplit(profile.mainGoal, profile.desiredBuild, profile.archetype);
  const dailyProtein = Math.round(profile.currentWeightLbs * proteinPerLb);
  // Remaining calories after protein (4 cal/g) split between carbs and fat
  const remainingCals = dailyCalories - dailyProtein * 4;
  const totalPct = carbPct + fatPct;
  const dailyCarbs = Math.round((remainingCals * (carbPct / totalPct)) / 4);
  const dailyFat = Math.round((remainingCals * (fatPct / totalPct)) / 9);

  const bmi = calcBMI(profile.currentWeightLbs, profile.heightFeet, profile.heightInches);

  return {
    dailyCalories,
    dailyProtein,
    dailyCarbs,
    dailyFat,
    tdee,
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory: bmiCategory(bmi),
  };
}
