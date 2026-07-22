/**
 * EatVera FitnessPage — Advanced AI Fitness System
 * Design: Premium Dark Forest — deep gradient, Playfair Display, DM Mono numerics,
 *         rounded-3xl cards with layered green gradients, glowing ring accents,
 *         crisp white-alpha text hierarchy. Matches ProgressPage premium aesthetic.
 * Tabs: Today | Program | Track | Stats
 */
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Dumbbell, Flame, ChevronRight, ChevronDown, ChevronUp,
  Check, RefreshCw, Calendar,
  Zap, Target, Clock, Repeat, TrendingUp, Award,
  Plus, ArrowRight, Shuffle, Activity,
  Heart, Wind, Footprints, Star, Lock,
  Minus, Loader2, Sparkles, ArrowUp, ArrowDown,
  BarChart2, Brain, Bolt
} from "lucide-react";
import { getBodyProfile } from "./OnboardingPage";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { hapticLight } from "@/lib/haptic";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  muscleGroups: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  substitutes: string[];
  notes?: string;
}

interface WorkoutDay {
  day: string;
  name: string;
  type: "strength" | "cardio" | "hiit" | "rest" | "mobility";
  duration: number;
  estimatedCalories: number;
  exercises: Exercise[];
  warmup: string[];
  cooldown: string[];
}

interface WeeklyProgram {
  week: number;
  theme: string;
  days: WorkoutDay[];
}

interface FitnessGoalConfig {
  id: string;
  label: string;
  icon: typeof Dumbbell;
  color: string;
  gradient: string;
  description: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FITNESS_GOALS: FitnessGoalConfig[] = [
  { id: "muscle_gain", label: "Muscle Gain", icon: Dumbbell, color: "#22c55e", gradient: "linear-gradient(135deg, #14532d, #22c55e)", description: "Build size and strength with progressive overload" },
  { id: "weight_loss", label: "Weight Loss", icon: Flame, color: "#f97316", gradient: "linear-gradient(135deg, #7c2d12, #f97316)", description: "Burn fat with cardio and metabolic training" },
  { id: "endurance", label: "Endurance", icon: Wind, color: "#3b82f6", gradient: "linear-gradient(135deg, #1e3a8a, #3b82f6)", description: "Build cardiovascular fitness and stamina" },
  { id: "athletic", label: "Athletic Performance", icon: Zap, color: "#a855f7", gradient: "linear-gradient(135deg, #581c87, #a855f7)", description: "Improve speed, power, and agility" },
  { id: "recomposition", label: "Body Recomposition", icon: Activity, color: "#ec4899", gradient: "linear-gradient(135deg, #831843, #ec4899)", description: "Lose fat while gaining muscle simultaneously" },
];

const EQUIPMENT_OPTIONS = [
  "Full gym", "Dumbbells only", "Barbell + rack", "Resistance bands", "Bodyweight only", "Home gym"
];

const FREQUENCY_OPTIONS = [
  { value: 3, label: "3 days/week", desc: "Ideal for beginners" },
  { value: 4, label: "4 days/week", desc: "Most popular split" },
  { value: 5, label: "5 days/week", desc: "Intermediate to advanced" },
  { value: 6, label: "6 days/week", desc: "Advanced athletes" },
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner", desc: "Less than 1 year" },
  { value: "intermediate", label: "Intermediate", desc: "1–3 years" },
  { value: "advanced", label: "Advanced", desc: "3+ years" },
];

const mobilityTips = [
  "10 min foam rolling — quads, hamstrings, upper back",
  "Hip flexor stretch — 60 sec each side",
  "Thoracic spine rotation — 10 reps each side",
  "Pigeon pose or figure-4 stretch — 90 sec each side",
  "Deep breathing and meditation — 5 min",
];

// ── Program Generator ──────────────────────────────────────────────────────────

function generateProgram(
  goal: string,
  frequency: number,
  experience: string,
  equipment: string,
  week: number
): WeeklyProgram {
  const overloadFactor = 1 + (week - 1) * 0.05;
  const baseReps = experience === "beginner" ? 12 : experience === "intermediate" ? 10 : 8;
  const repsHigh = Math.round(baseReps * overloadFactor);
  const repsLow = Math.round((baseReps - 2) * overloadFactor);
  const repRange = `${repsLow}–${repsHigh}`;
  const heavyRepRange = `${Math.round(repsLow * 0.7)}–${Math.round(repsHigh * 0.7)}`;

  const isBodyweight = equipment === "Bodyweight only";
  const hasBands = equipment === "Resistance bands";
  const hasDumbbells = equipment === "Dumbbells only" || equipment === "Full gym" || equipment === "Home gym";
  const hasBarbell = equipment === "Full gym" || equipment === "Barbell + rack";

  const generalWarmup = [
    "5 min light cardio (jog in place or jumping jacks)",
    "Arm circles — 10 forward, 10 backward",
    "Hip circles — 10 each direction",
    "Leg swings — 10 each leg",
    "Bodyweight squats — 10 reps",
  ];
  const upperWarmup = [
    "5 min light cardio",
    "Shoulder rolls — 10 each direction",
    "Band pull-aparts or arm circles — 15 reps",
    "Push-up to downward dog — 8 reps",
    "Wrist circles — 10 each direction",
  ];
  const lowerWarmup = [
    "5 min light cardio",
    "Hip flexor stretch — 30 sec each side",
    "Leg swings — 10 each direction",
    "Glute bridges — 15 reps",
    "Bodyweight squats — 15 reps",
  ];
  const generalCooldown = [
    "Child's pose — 60 sec",
    "Seated hamstring stretch — 45 sec each side",
    "Hip flexor stretch — 45 sec each side",
    "Chest opener stretch — 30 sec",
    "Deep breathing — 2 min",
  ];
  const upperCooldown = [
    "Doorway chest stretch — 45 sec",
    "Cross-body shoulder stretch — 30 sec each side",
    "Tricep overhead stretch — 30 sec each side",
    "Neck rolls — 30 sec",
    "Child's pose — 60 sec",
  ];
  const lowerCooldown = [
    "Standing quad stretch — 45 sec each side",
    "Seated hamstring stretch — 60 sec each side",
    "Pigeon pose — 60 sec each side",
    "Calf stretch against wall — 30 sec each side",
    "Supine spinal twist — 30 sec each side",
  ];

  const getExercises = (type: "push" | "pull" | "legs" | "full" | "cardio" | "core"): Exercise[] => {
    if (type === "push") {
      return [
        {
          name: hasBarbell ? "Barbell Bench Press" : hasDumbbells ? "Dumbbell Bench Press" : "Push-Ups",
          sets: 4, reps: heavyRepRange, rest: "90s",
          muscleGroups: ["Chest", "Triceps", "Front Delts"],
          difficulty: "intermediate",
          substitutes: ["Push-Ups", "Dumbbell Flyes", "Cable Chest Press"],
          notes: "Keep shoulder blades retracted. Control the descent.",
        },
        {
          name: hasBarbell ? "Overhead Press" : hasDumbbells ? "Dumbbell Shoulder Press" : "Pike Push-Ups",
          sets: 3, reps: repRange, rest: "75s",
          muscleGroups: ["Shoulders", "Triceps"],
          difficulty: "intermediate",
          substitutes: ["Arnold Press", "Lateral Raises", "Band Press"],
          notes: "Brace core. Avoid excessive lumbar arch.",
        },
        {
          name: hasDumbbells ? "Incline Dumbbell Press" : "Incline Push-Ups",
          sets: 3, reps: repRange, rest: "60s",
          muscleGroups: ["Upper Chest", "Front Delts"],
          difficulty: "beginner",
          substitutes: ["Cable Incline Fly", "Landmine Press"],
        },
        {
          name: "Tricep Dips",
          sets: 3, reps: repRange, rest: "60s",
          muscleGroups: ["Triceps", "Chest"],
          difficulty: "beginner",
          substitutes: ["Skull Crushers", "Tricep Pushdowns", "Diamond Push-Ups"],
        },
        {
          name: hasDumbbells ? "Lateral Raises" : "Band Lateral Raises",
          sets: 3, reps: `${repsHigh}–${repsHigh + 4}`, rest: "45s",
          muscleGroups: ["Side Delts"],
          difficulty: "beginner",
          substitutes: ["Cable Lateral Raise", "Upright Row"],
        },
      ];
    }
    if (type === "pull") {
      return [
        {
          name: isBodyweight ? "Pull-Ups" : hasBarbell ? "Barbell Rows" : "Dumbbell Rows",
          sets: 4, reps: heavyRepRange, rest: "90s",
          muscleGroups: ["Lats", "Biceps", "Rear Delts"],
          difficulty: "intermediate",
          substitutes: ["Lat Pulldown", "Resistance Band Rows", "Inverted Rows"],
          notes: "Full range of motion. Squeeze at the top.",
        },
        {
          name: hasBarbell ? "Deadlift" : hasDumbbells ? "Romanian Deadlift" : "Good Mornings",
          sets: 3, reps: heavyRepRange, rest: "120s",
          muscleGroups: ["Hamstrings", "Glutes", "Lower Back"],
          difficulty: "advanced",
          substitutes: ["Trap Bar Deadlift", "Kettlebell Deadlift", "Hip Thrust"],
          notes: "Neutral spine throughout. Drive through heels.",
        },
        {
          name: hasDumbbells ? "Face Pulls / Rear Delt Fly" : "Band Face Pulls",
          sets: 3, reps: repRange, rest: "45s",
          muscleGroups: ["Rear Delts", "Rotator Cuff"],
          difficulty: "beginner",
          substitutes: ["Cable Face Pull", "Reverse Fly"],
        },
        {
          name: hasDumbbells ? "Dumbbell Bicep Curls" : isBodyweight ? "Chin-Ups" : "Band Bicep Curls",
          sets: 3, reps: repRange, rest: "60s",
          muscleGroups: ["Biceps"],
          difficulty: "beginner",
          substitutes: ["Hammer Curls", "Preacher Curls", "Concentration Curls"],
        },
      ];
    }
    if (type === "legs") {
      return [
        {
          name: hasBarbell ? "Back Squat" : hasDumbbells ? "Goblet Squat" : "Bodyweight Squat",
          sets: 4, reps: heavyRepRange, rest: "120s",
          muscleGroups: ["Quads", "Glutes", "Hamstrings"],
          difficulty: "intermediate",
          substitutes: ["Leg Press", "Front Squat", "Bulgarian Split Squat"],
          notes: "Knees track over toes. Chest up throughout.",
        },
        {
          name: hasDumbbells ? "Dumbbell Lunges" : "Bodyweight Lunges",
          sets: 3, reps: `${repsLow}–${repsHigh} each`, rest: "75s",
          muscleGroups: ["Quads", "Glutes"],
          difficulty: "beginner",
          substitutes: ["Step-Ups", "Split Squats", "Reverse Lunges"],
        },
        {
          name: hasDumbbells ? "Romanian Deadlift" : "Good Mornings",
          sets: 3, reps: repRange, rest: "90s",
          muscleGroups: ["Hamstrings", "Glutes"],
          difficulty: "intermediate",
          substitutes: ["Leg Curl", "Nordic Curl", "Swiss Ball Leg Curl"],
        },
        {
          name: "Calf Raises",
          sets: 4, reps: `${repsHigh}–${repsHigh + 6}`, rest: "45s",
          muscleGroups: ["Calves"],
          difficulty: "beginner",
          substitutes: ["Seated Calf Raise", "Donkey Calf Raise"],
        },
      ];
    }
    if (type === "full") {
      return [
        {
          name: hasBarbell ? "Power Clean" : hasDumbbells ? "Dumbbell Thruster" : "Burpees",
          sets: 4, reps: heavyRepRange, rest: "90s",
          muscleGroups: ["Full Body", "Explosiveness"],
          difficulty: "advanced",
          substitutes: ["Kettlebell Swing", "Box Jump", "Jump Squat"],
        },
        {
          name: hasBarbell ? "Deadlift" : hasDumbbells ? "Dumbbell Deadlift" : "Hip Hinge",
          sets: 3, reps: heavyRepRange, rest: "120s",
          muscleGroups: ["Posterior Chain", "Core"],
          difficulty: "intermediate",
          substitutes: ["Trap Bar Deadlift", "Sumo Deadlift"],
        },
        {
          name: hasDumbbells ? "Dumbbell Push Press" : "Push-Up to Row",
          sets: 3, reps: repRange, rest: "60s",
          muscleGroups: ["Shoulders", "Triceps", "Back"],
          difficulty: "intermediate",
          substitutes: ["Barbell Push Press", "Band Press"],
        },
        {
          name: "Plank",
          sets: 3, reps: "45–60 sec", rest: "30s",
          muscleGroups: ["Core", "Stability"],
          difficulty: "beginner",
          substitutes: ["Dead Bug", "Ab Wheel Rollout", "Hollow Body Hold"],
        },
      ];
    }
    if (type === "cardio") {
      return [
        {
          name: "Running / Jogging",
          sets: 1, reps: "20–30 min", rest: "—",
          muscleGroups: ["Cardiovascular", "Legs"],
          difficulty: "beginner",
          substitutes: ["Cycling", "Rowing Machine", "Incline Walking", "Elliptical"],
          notes: "Maintain conversational pace (Zone 2). Heart rate 120–140 bpm.",
        },
        {
          name: "Jump Rope",
          sets: 5, reps: "2 min on / 1 min off", rest: "60s",
          muscleGroups: ["Cardiovascular", "Calves", "Coordination"],
          difficulty: "intermediate",
          substitutes: ["Shadow Boxing", "High Knees", "Cycling Sprints"],
        },
        {
          name: "Box Jumps",
          sets: 4, reps: "8–10", rest: "60s",
          muscleGroups: ["Explosiveness", "Quads", "Glutes"],
          difficulty: "intermediate",
          substitutes: ["Squat Jumps", "Step-Ups", "Broad Jumps"],
        },
      ];
    }
    // core
    return [
      {
        name: "Plank",
        sets: 3, reps: "60 sec", rest: "30s",
        muscleGroups: ["Core", "Stability"],
        difficulty: "beginner",
        substitutes: ["Dead Bug", "Ab Wheel Rollout"],
      },
      {
        name: "Hanging Leg Raises",
        sets: 3, reps: repRange, rest: "45s",
        muscleGroups: ["Lower Abs", "Hip Flexors"],
        difficulty: "intermediate",
        substitutes: ["Lying Leg Raises", "V-Ups", "Dragon Flag"],
      },
      {
        name: "Russian Twists",
        sets: 3, reps: `${repsHigh} each side`, rest: "30s",
        muscleGroups: ["Obliques", "Core"],
        difficulty: "beginner",
        substitutes: ["Cable Woodchop", "Side Plank"],
      },
    ];
  };

  const weekThemes: Record<number, string> = {
    1: "Foundation — Master the basics",
    2: "Build — Add 5% load",
    3: "Intensity — Shorter rest, more volume",
    4: "Deload — 60% volume, full recovery",
    5: "Strength — Heavy compound focus",
    6: "Hypertrophy — High volume, moderate weight",
    7: "Peak — Max effort",
    8: "Test & Reset — PRs and reassess",
  };

  const buildDays = (splits: Array<{ name: string; type: WorkoutDay["type"]; exercises: Exercise[]; warmup: string[]; cooldown: string[]; duration: number; calories: number }>): WorkoutDay[] => {
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const result: WorkoutDay[] = [];
    let dayIdx = 0;
    for (const split of splits) {
      result.push({
        day: `Day ${dayIdx + 1}`,
        name: split.name,
        type: split.type,
        duration: split.duration,
        estimatedCalories: split.calories,
        exercises: split.exercises,
        warmup: split.warmup,
        cooldown: split.cooldown,
      });
      dayIdx++;
    }
    // Fill remaining days as rest
    while (result.length < 7) {
      result.push({
        day: `Day ${result.length + 1}`,
        name: "Rest & Recovery",
        type: "rest",
        duration: 0,
        estimatedCalories: 0,
        exercises: [],
        warmup: [],
        cooldown: [],
      });
    }
    return result.slice(0, 7);
  };

  let splits: Array<{ name: string; type: WorkoutDay["type"]; exercises: Exercise[]; warmup: string[]; cooldown: string[]; duration: number; calories: number }> = [];

  if (goal === "muscle_gain") {
    if (frequency === 3) {
      splits = [
        { name: "Full Body A", type: "strength", exercises: getExercises("full"), warmup: generalWarmup, cooldown: generalCooldown, duration: 55, calories: 320 },
        { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
        { name: "Full Body B", type: "strength", exercises: [...getExercises("push").slice(0, 3), ...getExercises("pull").slice(0, 2)], warmup: upperWarmup, cooldown: upperCooldown, duration: 60, calories: 350 },
        { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
        { name: "Full Body C", type: "strength", exercises: [...getExercises("legs").slice(0, 3), ...getExercises("core")], warmup: lowerWarmup, cooldown: lowerCooldown, duration: 55, calories: 340 },
      ];
    } else if (frequency === 4) {
      splits = [
        { name: "Upper Body Push", type: "strength", exercises: getExercises("push"), warmup: upperWarmup, cooldown: upperCooldown, duration: 60, calories: 340 },
        { name: "Lower Body", type: "strength", exercises: getExercises("legs"), warmup: lowerWarmup, cooldown: lowerCooldown, duration: 65, calories: 380 },
        { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
        { name: "Upper Body Pull", type: "strength", exercises: getExercises("pull"), warmup: upperWarmup, cooldown: upperCooldown, duration: 60, calories: 330 },
        { name: "Legs & Core", type: "strength", exercises: [...getExercises("legs").slice(2), ...getExercises("core")], warmup: lowerWarmup, cooldown: lowerCooldown, duration: 55, calories: 320 },
      ];
    } else {
      splits = [
        { name: "Chest & Triceps", type: "strength", exercises: getExercises("push"), warmup: upperWarmup, cooldown: upperCooldown, duration: 60, calories: 340 },
        { name: "Back & Biceps", type: "strength", exercises: getExercises("pull"), warmup: upperWarmup, cooldown: upperCooldown, duration: 60, calories: 330 },
        { name: "Legs", type: "strength", exercises: getExercises("legs"), warmup: lowerWarmup, cooldown: lowerCooldown, duration: 65, calories: 380 },
        { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
        { name: "Shoulders & Arms", type: "strength", exercises: [...getExercises("push").slice(1, 3), ...getExercises("pull").slice(3)], warmup: upperWarmup, cooldown: upperCooldown, duration: 55, calories: 300 },
        { name: "Full Body Power", type: "strength", exercises: getExercises("full"), warmup: generalWarmup, cooldown: generalCooldown, duration: 60, calories: 360 },
      ];
    }
  } else if (goal === "weight_loss") {
    splits = [
      { name: "HIIT Cardio", type: "hiit", exercises: getExercises("cardio"), warmup: generalWarmup, cooldown: generalCooldown, duration: 35, calories: 420 },
      { name: "Full Body Strength", type: "strength", exercises: getExercises("full"), warmup: generalWarmup, cooldown: generalCooldown, duration: 50, calories: 360 },
      { name: "Steady State Cardio", type: "cardio", exercises: getExercises("cardio").slice(0, 1), warmup: generalWarmup, cooldown: generalCooldown, duration: 40, calories: 380 },
      { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
      { name: "Circuit Training", type: "hiit", exercises: [...getExercises("push").slice(0, 2), ...getExercises("legs").slice(0, 2), ...getExercises("core")], warmup: generalWarmup, cooldown: generalCooldown, duration: 45, calories: 450 },
    ];
    if (frequency >= 5) {
      splits.push({ name: "Active Recovery Run", type: "cardio", exercises: getExercises("cardio").slice(0, 1), warmup: generalWarmup, cooldown: generalCooldown, duration: 30, calories: 280 });
    }
  } else if (goal === "endurance") {
    splits = [
      { name: "Long Run / Zone 2", type: "cardio", exercises: getExercises("cardio").slice(0, 1), warmup: generalWarmup, cooldown: generalCooldown, duration: 45, calories: 420 },
      { name: "Interval Training", type: "hiit", exercises: getExercises("cardio"), warmup: generalWarmup, cooldown: generalCooldown, duration: 40, calories: 480 },
      { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
      { name: "Strength & Stability", type: "strength", exercises: [...getExercises("legs").slice(0, 3), ...getExercises("core")], warmup: lowerWarmup, cooldown: lowerCooldown, duration: 50, calories: 320 },
      { name: "Tempo Run / Bike", type: "cardio", exercises: getExercises("cardio").slice(0, 2), warmup: generalWarmup, cooldown: generalCooldown, duration: 35, calories: 360 },
    ];
  } else if (goal === "athletic") {
    splits = [
      { name: "Power & Explosiveness", type: "strength", exercises: getExercises("full"), warmup: generalWarmup, cooldown: generalCooldown, duration: 60, calories: 400 },
      { name: "Speed & Agility", type: "hiit", exercises: getExercises("cardio"), warmup: generalWarmup, cooldown: generalCooldown, duration: 45, calories: 450 },
      { name: "Upper Body Strength", type: "strength", exercises: [...getExercises("push"), ...getExercises("pull").slice(0, 2)], warmup: upperWarmup, cooldown: upperCooldown, duration: 65, calories: 370 },
      { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
      { name: "Lower Body Power", type: "strength", exercises: getExercises("legs"), warmup: lowerWarmup, cooldown: lowerCooldown, duration: 60, calories: 420 },
    ];
    if (frequency >= 5) {
      splits.push({ name: "Conditioning", type: "hiit", exercises: getExercises("cardio"), warmup: generalWarmup, cooldown: generalCooldown, duration: 40, calories: 430 });
    }
  } else {
    // recomposition
    splits = [
      { name: "Upper Push + Cardio Finisher", type: "strength", exercises: [...getExercises("push"), ...getExercises("cardio").slice(1, 2)], warmup: upperWarmup, cooldown: upperCooldown, duration: 65, calories: 420 },
      { name: "Lower Body", type: "strength", exercises: getExercises("legs"), warmup: lowerWarmup, cooldown: lowerCooldown, duration: 60, calories: 400 },
      { name: "HIIT", type: "hiit", exercises: getExercises("cardio"), warmup: generalWarmup, cooldown: generalCooldown, duration: 35, calories: 440 },
      { name: "Rest", type: "rest", exercises: [], warmup: [], cooldown: [], duration: 0, calories: 0 },
      { name: "Upper Pull + Core", type: "strength", exercises: [...getExercises("pull"), ...getExercises("core")], warmup: upperWarmup, cooldown: upperCooldown, duration: 65, calories: 390 },
    ];
    if (frequency >= 5) {
      splits.push({ name: "Steady State Cardio", type: "cardio", exercises: getExercises("cardio").slice(0, 1), warmup: generalWarmup, cooldown: generalCooldown, duration: 40, calories: 350 });
    }
  }

  return {
    week,
    theme: weekThemes[week] ?? "Progressive Overload",
    days: buildDays(splits),
  };
}

// ── Workout Type Icon ──────────────────────────────────────────────────────────

function WorkoutTypeIcon({ type, size = 18 }: { type: WorkoutDay["type"]; size?: number }) {
  const configs = {
    strength: { icon: Dumbbell, bg: "rgba(34,197,94,0.15)", color: "#22c55e" },
    cardio: { icon: Heart, bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
    hiit: { icon: Zap, bg: "rgba(249,115,22,0.15)", color: "#f97316" },
    rest: { icon: Star, bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    mobility: { icon: Footprints, bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  };
  const cfg = configs[type] ?? configs.strength;
  const Icon = cfg.icon;
  return (
    <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
      style={{ background: cfg.bg }}>
      <Icon size={size} style={{ color: cfg.color }} />
    </div>
  );
}

// ── Premium Exercise Card ──────────────────────────────────────────────────────

function ExerciseCard({ exercise, weekNum }: { exercise: Exercise; weekNum: number }) {
  const [expanded, setExpanded] = useState(false);
  const [showSubs, setShowSubs] = useState(false);

  const difficultyColor = exercise.difficulty === "advanced" ? "#ef4444" : exercise.difficulty === "intermediate" ? "#f97316" : "#22c55e";

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
      <div className="flex items-center gap-3 p-3.5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(34,197,94,0.12)" }}>
          <span className="text-[11px] font-bold" style={{ color: "#22c55e", fontFamily: "'DM Mono', monospace" }}>
            {exercise.sets}×
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white/90 truncate">{exercise.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-mono" style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace" }}>
              {exercise.reps}
            </span>
            <span className="text-white/20">·</span>
            <span className="text-xs text-white/35">Rest {exercise.rest}</span>
            {weekNum > 1 && (
              <>
                <span className="text-white/20">·</span>
                <span className="text-xs" style={{ color: "#fb923c" }}>+{Math.round((weekNum - 1) * 5)}%</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSubs(!showSubs)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
            title="Substitutes"
          >
            <Shuffle size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
          >
            {expanded
              ? <ChevronUp size={12} style={{ color: "rgba(255,255,255,0.35)" }} />
              : <ChevronDown size={12} style={{ color: "rgba(255,255,255,0.35)" }} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex flex-wrap gap-1.5 mt-2.5 mb-2">
            {exercise.muscleGroups.map(m => (
              <span key={m} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80" }}>{m}</span>
            ))}
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${difficultyColor}15`, color: difficultyColor }}>
              {exercise.difficulty}
            </span>
          </div>
          {exercise.notes && (
            <p className="text-xs leading-relaxed text-white/40">{exercise.notes}</p>
          )}
        </div>
      )}

      {showSubs && (
        <div className="px-3.5 pb-3.5 pt-0 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mt-2.5 mb-2">Substitutes</p>
          <div className="flex flex-wrap gap-1.5">
            {exercise.substitutes.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Premium Workout Day Card ───────────────────────────────────────────────────

function WorkoutDayCard({ day, weekNum, isToday = false }: { day: WorkoutDay; weekNum: number; isToday?: boolean }) {
  const [expanded, setExpanded] = useState(isToday);
  const [showWarmup, setShowWarmup] = useState(false);
  const [showCooldown, setShowCooldown] = useState(false);

  if (day.type === "rest") {
    return (
      <div className="rounded-2xl p-4"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <WorkoutTypeIcon type="rest" size={16} />
          <div>
            <p className="font-semibold text-sm text-white/50">{day.day} — {day.name}</p>
            <p className="text-xs mt-0.5 text-white/25">Recovery is where growth happens</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: isToday
          ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))"
          : "rgba(255,255,255,0.03)",
        border: isToday ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.07)",
        boxShadow: isToday ? "0 4px 24px rgba(34,197,94,0.08)" : "none",
      }}>
      <button className="w-full flex items-center gap-3 p-4" onClick={() => setExpanded(!expanded)}>
        <WorkoutTypeIcon type={day.type} size={16} />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-white/90">{day.day} — {day.name}</p>
            {isToday && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ background: "rgba(34,197,94,0.2)", color: "#4ade80" }}>TODAY</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs flex items-center gap-1 text-white/35">
              <Clock size={10} /> {day.duration} min
            </span>
            <span className="text-xs flex items-center gap-1 text-white/35">
              <Flame size={10} /> ~{day.estimatedCalories} cal
            </span>
            <span className="text-xs flex items-center gap-1 text-white/35">
              <Repeat size={10} /> {day.exercises.length} exercises
            </span>
          </div>
        </div>
        {expanded
          ? <ChevronUp size={15} style={{ color: "rgba(255,255,255,0.3)" }} />
          : <ChevronRight size={15} style={{ color: "rgba(255,255,255,0.3)" }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {/* Warmup */}
          {day.warmup.length > 0 && (
            <div className="pt-3">
              <button className="flex items-center gap-2 mb-2" onClick={() => setShowWarmup(!showWarmup)}>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#fb923c" }}>Warm-Up</span>
                {showWarmup ? <ChevronUp size={11} style={{ color: "#fb923c" }} /> : <ChevronDown size={11} style={{ color: "#fb923c" }} />}
              </button>
              {showWarmup && (
                <div className="space-y-1.5 mb-3">
                  {day.warmup.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(249,115,22,0.15)" }}>
                        <span className="text-[9px] font-bold" style={{ color: "#fb923c" }}>{i + 1}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-white/50">{w}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Exercises */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: "#4ade80" }}>Exercises</p>
            <div className="space-y-2">
              {day.exercises.map((ex, i) => (
                <ExerciseCard key={i} exercise={ex} weekNum={weekNum} />
              ))}
            </div>
          </div>

          {/* Cooldown */}
          {day.cooldown.length > 0 && (
            <div>
              <button className="flex items-center gap-2 mb-2" onClick={() => setShowCooldown(!showCooldown)}>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#60a5fa" }}>Cool-Down</span>
                {showCooldown ? <ChevronUp size={11} style={{ color: "#60a5fa" }} /> : <ChevronDown size={11} style={{ color: "#60a5fa" }} />}
              </button>
              {showCooldown && (
                <div className="space-y-1.5">
                  {day.cooldown.map((c, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(59,130,246,0.15)" }}>
                        <span className="text-[9px] font-bold" style={{ color: "#60a5fa" }}>{i + 1}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-white/50">{c}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Setup Screen ───────────────────────────────────────────────────────────────

interface FitnessSetup {
  goal: string;
  frequency: number;
  experience: string;
  equipment: string;
  injuries: string;
  currentWeek: number;
}

const SETUP_KEY = "eatclean-fitness-setup";

function getFitnessSetup(): FitnessSetup | null {
  try {
    const raw = localStorage.getItem(SETUP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveFitnessSetup(setup: FitnessSetup): void {
  localStorage.setItem(SETUP_KEY, JSON.stringify(setup));
}

function SetupScreen({ onComplete }: { onComplete: (setup: FitnessSetup) => void }) {
  const profile = getBodyProfile();

  const defaultGoal = profile?.mainGoal === "build_muscle" ? "muscle_gain"
    : profile?.mainGoal === "lose_fat" ? "weight_loss"
    : profile?.mainGoal === "maintain_muscle_lose_weight" ? "recomposition"
    : "muscle_gain";

  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(defaultGoal);
  const [frequency, setFrequency] = useState(4);
  const [experience, setExperience] = useState("beginner");
  const [equipment, setEquipment] = useState("Full gym");
  const [injuries, setInjuries] = useState("");

  const steps = ["Your Goal", "Frequency", "Experience", "Equipment"];

  function handleFinish() {
    const setup: FitnessSetup = { goal, frequency, experience, equipment, injuries, currentWeek: 1 };
    saveFitnessSetup(setup);
    onComplete(setup);
  }

  const selectedGoal = FITNESS_GOALS.find(g => g.id === goal) ?? FITNESS_GOALS[0];

  return (
    <div className="min-h-screen pb-28"
      style={{ background: "linear-gradient(160deg, #070f0a 0%, #0a1f14 50%, #060d08 100%)" }}>

      {/* Hero header */}
      <div className="px-5 pt-12 pb-6">
        <p className="text-green-400/40 text-[10px] uppercase tracking-[0.22em] mb-3"
          style={{ fontFamily: "'DM Mono', monospace" }}>
          EatVera Fitness
        </p>
        <h1 className="text-white font-bold leading-tight mb-2"
          style={{ fontFamily: "'Playfair Display', serif", fontSize: 28 }}>
          Build Your Program
        </h1>
        <p className="text-white/35 text-sm">
          Answer a few questions to get your personalized 8-week plan
        </p>
      </div>

      {/* Progress bar */}
      <div className="px-5 mb-8">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div key={i} className="h-0.5 rounded-full flex-1 transition-all duration-500"
              style={{ background: i <= step ? "#22c55e" : "rgba(255,255,255,0.08)" }} />
          ))}
        </div>
        <p className="text-white/25 text-[11px] mt-2"
          style={{ fontFamily: "'DM Mono', monospace" }}>
          {step + 1} / {steps.length} — {steps[step]}
        </p>
      </div>

      <div className="px-5 space-y-3">
        {/* Step 0: Goal */}
        {step === 0 && FITNESS_GOALS.map(g => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-200"
            style={{
              background: goal === g.id
                ? `linear-gradient(135deg, ${g.color}18, ${g.color}08)`
                : "rgba(255,255,255,0.03)",
              border: goal === g.id ? `1px solid ${g.color}45` : "1px solid rgba(255,255,255,0.07)",
              boxShadow: goal === g.id ? `0 4px 20px ${g.color}15` : "none",
            }}
          >
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${g.color}18` }}>
              <g.icon size={20} style={{ color: g.color }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white/90">{g.label}</p>
              <p className="text-xs mt-0.5 text-white/40">{g.description}</p>
            </div>
            {goal === g.id && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: g.color }}>
                <Check size={13} className="text-white" />
              </div>
            )}
          </button>
        ))}

        {/* Step 1: Frequency */}
        {step === 1 && FREQUENCY_OPTIONS.map(f => (
          <button
            key={f.value}
            onClick={() => setFrequency(f.value)}
            className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
            style={{
              background: frequency === f.value ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
              border: frequency === f.value ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <p className="font-semibold text-sm text-white/90">{f.label}</p>
              <p className="text-xs mt-0.5 text-white/40">{f.desc}</p>
            </div>
            {frequency === f.value && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#22c55e" }}>
                <Check size={13} className="text-white" />
              </div>
            )}
          </button>
        ))}

        {/* Step 2: Experience */}
        {step === 2 && EXPERIENCE_OPTIONS.map(e => (
          <button
            key={e.value}
            onClick={() => setExperience(e.value)}
            className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
            style={{
              background: experience === e.value ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
              border: experience === e.value ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <p className="font-semibold text-sm text-white/90">{e.label}</p>
              <p className="text-xs mt-0.5 text-white/40">{e.desc}</p>
            </div>
            {experience === e.value && (
              <div className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#22c55e" }}>
                <Check size={13} className="text-white" />
              </div>
            )}
          </button>
        ))}

        {/* Step 3: Equipment */}
        {step === 3 && (
          <>
            {EQUIPMENT_OPTIONS.map(eq => (
              <button
                key={eq}
                onClick={() => setEquipment(eq)}
                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200"
                style={{
                  background: equipment === eq ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                  border: equipment === eq ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <p className="font-semibold text-sm text-white/90">{eq}</p>
                {equipment === eq && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "#22c55e" }}>
                    <Check size={13} className="text-white" />
                  </div>
                )}
              </button>
            ))}
            <div className="mt-1">
              <p className="text-xs font-semibold text-white/35 mb-2">Injuries or limitations (optional)</p>
              <textarea
                value={injuries}
                onChange={e => setInjuries(e.target.value)}
                placeholder="e.g. bad knees, shoulder injury..."
                rows={2}
                className="w-full rounded-xl p-3 text-sm resize-none outline-none text-white/80 placeholder-white/20"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-20 left-0 right-0 px-5 flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex-1 py-4 rounded-2xl font-semibold text-sm transition-all text-white/60"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Back
          </button>
        )}
        <button
          onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : handleFinish()}
          className="flex-1 py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all"
          style={{
            background: selectedGoal.gradient,
            boxShadow: `0 8px 24px ${selectedGoal.color}30`,
          }}
        >
          {step < steps.length - 1 ? "Continue" : "Build My Program"}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Track Tab ─────────────────────────────────────────────────────────────────

interface TrackedSet { reps: number; weight: number; completed: boolean; }
interface TrackedExercise extends Exercise { loggedSets: TrackedSet[]; expanded: boolean; }

function TrackTab({ program, selectedWeek, programId }: {
  program: WeeklyProgram | null;
  selectedWeek: number;
  programId?: number;
}) {
  const utils = trpc.useUtils();
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todaySessions } = trpc.workout.getSessions.useQuery({ startDate: today, endDate: today });

  const workoutDays = program?.days.filter(d => d.type !== "rest" && d.type !== "mobility") || [];
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [trackedExercises, setTrackedExercises] = useState<TrackedExercise[]>([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [confirmRestDay, setConfirmRestDay] = useState(false);

  const selectedDay = workoutDays[selectedDayIndex];

  // Fetch last logged weights for this workout to pre-fill sets
  const { data: lastWeights } = trpc.workout.getLastWeightsForWorkout.useQuery(
    { workoutName: selectedDay?.name || "" },
    { enabled: !!selectedDay?.name }
  );

  const logSessionMutation = trpc.workout.logSession.useMutation({
    onSuccess: () => {
      utils.workout.getSessions.invalidate();
      setSessionDone(true);
      toast.success("Workout logged! 🔥");
    },
    onError: (err) => toast.error("Failed to log: " + err.message),
  });

  useEffect(() => {
    if (selectedDay) {
      setTrackedExercises(selectedDay.exercises.map(ex => {
        const prevWeights = lastWeights?.[ex.name] ?? [];
        return {
          ...ex,
          loggedSets: Array.from({ length: ex.sets }, (_, i) => ({
            reps: parseInt(ex.reps) || 10,
            weight: prevWeights[i] ?? prevWeights[0] ?? 0,
            completed: false,
          })),
          expanded: false,
        };
      }));
      setSessionDone(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayIndex, selectedWeek, lastWeights]);

  const toggleSet = (exIdx: number, setIdx: number) => {
    setTrackedExercises(prev => prev.map((ex, i) =>
      i === exIdx ? { ...ex, loggedSets: ex.loggedSets.map((s, j) => j === setIdx ? { ...s, completed: !s.completed } : s) } : ex
    ));
  };

  const updateSetValue = (exIdx: number, setIdx: number, field: "reps" | "weight", delta: number) => {
    setTrackedExercises(prev => prev.map((ex, i) =>
      i === exIdx ? { ...ex, loggedSets: ex.loggedSets.map((s, j) => j === setIdx ? { ...s, [field]: Math.max(0, s[field] + delta) } : s) } : ex
    ));
  };

  const toggleExpand = (exIdx: number) => {
    setTrackedExercises(prev => prev.map((ex, i) => i === exIdx ? { ...ex, expanded: !ex.expanded } : ex));
  };

  const completedSets = trackedExercises.reduce((sum, ex) => sum + ex.loggedSets.filter(s => s.completed).length, 0);
  const totalSets = trackedExercises.reduce((sum, ex) => sum + ex.loggedSets.length, 0);
  const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  // Check if this is a rest/mobility day (workoutDays excludes rest, but user may have no exercises)
  const isRestDay = !selectedDay || selectedDay.exercises.length === 0;

  const doFinishSession = () => {
    setConfirmRestDay(false);
    const exercisesData = trackedExercises.map(ex => ({
      name: ex.name,
      sets: ex.loggedSets.length,
      reps: ex.loggedSets[0]?.reps || 0,
      weight: ex.loggedSets[0]?.weight || 0,
      completed: ex.loggedSets.some(s => s.completed),
      loggedSets: ex.loggedSets,
    }));
    logSessionMutation.mutate({
      programId,
      date: today,
      workoutName: selectedDay?.name || "Workout",
      exercisesJson: JSON.stringify(exercisesData),
      durationMin: selectedDay?.duration,
      caloriesBurned: selectedDay?.estimatedCalories,
      notes: notes || undefined,
      rating: rating || undefined,
    });
  };

  const finishSession = () => {
    if (isRestDay) {
      setConfirmRestDay(true);
      return;
    }
    doFinishSession();
  };

  if (!program || workoutDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 px-4">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <Dumbbell size={28} style={{ color: "rgba(255,255,255,0.2)" }} />
        </div>
        <p className="font-semibold text-white/50">No program active</p>
        <p className="text-sm text-center text-white/30">Set up your fitness program first to start tracking</p>
      </div>
    );
  }

  if (sessionDone) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5 px-4">
        <div className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.08))",
            border: "1px solid rgba(34,197,94,0.3)",
            boxShadow: "0 0 40px rgba(34,197,94,0.15)",
          }}>
          <Award size={40} style={{ color: "#22c55e" }} />
        </div>
        <div className="text-center">
          <h3 className="font-bold text-2xl text-white mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Workout Complete!
          </h3>
          <p className="text-sm text-white/40">{completedSets}/{totalSets} sets</p>
        </div>
        <button
          onClick={() => { setSessionDone(false); }}
          className="px-8 py-3.5 rounded-2xl text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #14532d, #22c55e)", boxShadow: "0 8px 24px rgba(34,197,94,0.25)" }}>
          Log Another Workout
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 space-y-3">
      {/* Today's sessions badge */}
      {(todaySessions?.length || 0) > 0 && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "#22c55e" }}>
            <Check size={11} className="text-white" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#4ade80" }}>
            {todaySessions!.length} workout{todaySessions!.length > 1 ? "s" : ""} logged today
          </span>
        </div>
      )}

      {/* Day selector pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {workoutDays.map((day, i) => (
          <button key={i} onClick={() => setSelectedDayIndex(i)}
            className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
            style={{
              background: selectedDayIndex === i
                ? "linear-gradient(135deg, #14532d, #22c55e)"
                : "rgba(255,255,255,0.05)",
              border: selectedDayIndex === i ? "none" : "1px solid rgba(255,255,255,0.08)",
              color: selectedDayIndex === i ? "white" : "rgba(255,255,255,0.45)",
              boxShadow: selectedDayIndex === i ? "0 4px 12px rgba(34,197,94,0.2)" : "none",
            }}>
            {day.name.split(" ").slice(0, 2).join(" ")}
          </button>
        ))}
      </div>

      {/* Session hero card */}
      {selectedDay && (
        <div className="rounded-3xl p-5"
          style={{
            background: "linear-gradient(135deg, #0c3d2b 0%, #0f4a35 55%, #0a3224 100%)",
            border: "1px solid rgba(34,197,94,0.15)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-green-400/40 text-[10px] uppercase tracking-[0.18em] mb-1"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                {selectedDay.day}
              </p>
              <h3 className="font-bold text-lg text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                {selectedDay.name}
              </h3>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-white/35 flex items-center gap-1">
                  <Clock size={10} /> {selectedDay.duration} min
                </span>
                <span className="text-xs text-white/35 flex items-center gap-1">
                  <Flame size={10} /> ~{selectedDay.estimatedCalories} cal
                </span>
              </div>
            </div>
            <button
              onClick={finishSession}
              disabled={logSessionMutation.isPending}
              className="px-4 py-2.5 rounded-2xl text-white text-sm font-bold flex items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #1a5c2a, #22c55e)",
                boxShadow: "0 4px 16px rgba(34,197,94,0.25)",
                opacity: logSessionMutation.isPending ? 0.7 : 1,
              }}>
              {logSessionMutation.isPending
                ? <Loader2 size={13} className="animate-spin" />
                : <Check size={13} />}
              Complete
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1.5 text-white/35">
              <span>{completedSets} of {totalSets} sets done</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)" }} />
            </div>
          </div>
        </div>
      )}

      {/* Exercise tracking list */}
      {trackedExercises.map((ex, exIdx) => {
        const allDone = ex.loggedSets.every(s => s.completed);
        const doneSets = ex.loggedSets.filter(s => s.completed).length;
        return (
          <div key={exIdx} className="rounded-2xl overflow-hidden transition-all duration-200"
            style={{
              background: allDone
                ? "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))"
                : "rgba(255,255,255,0.03)",
              border: allDone ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(255,255,255,0.07)",
            }}>
            <button className="w-full p-4 flex items-center gap-3" onClick={() => toggleExpand(exIdx)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: allDone ? "#22c55e" : "rgba(255,255,255,0.07)",
                  color: allDone ? "white" : "rgba(255,255,255,0.45)",
                }}>
                {allDone ? <Check size={15} /> : (
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{exIdx + 1}</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm text-white/90">{ex.name}</p>
                <p className="text-xs mt-0.5 text-white/35">
                  {ex.sets} sets × {ex.reps} · {doneSets}/{ex.sets} done
                  {lastWeights?.[ex.name] && (
                    <span className="ml-1.5" style={{ color: "rgba(74,222,128,0.6)" }}>
                      • last: {lastWeights[ex.name][0]}lbs
                    </span>
                  )}
                </p>
              </div>
              {ex.expanded
                ? <ChevronUp size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)" }} />}
            </button>

            {ex.expanded && (
              <div className="px-4 pb-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-4 gap-2 text-[10px] uppercase tracking-widest px-1 text-white/25"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    <span>Set</span><span>Reps</span><span>lbs</span><span>Done</span>
                  </div>
                  {ex.loggedSets.map((set, setIdx) => (
                    <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                      <span className="text-sm font-medium pl-1 text-white/40"
                        style={{ fontFamily: "'DM Mono', monospace" }}>{setIdx + 1}</span>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => updateSetValue(exIdx, setIdx, "reps", -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.07)" }}>
                          <Minus size={9} style={{ color: "rgba(255,255,255,0.5)" }} />
                        </button>
                        <span className="font-bold text-sm w-5 text-center text-white/90"
                          style={{ fontFamily: "'DM Mono', monospace" }}>{set.reps}</span>
                        <button onClick={() => updateSetValue(exIdx, setIdx, "reps", 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.07)" }}>
                          <Plus size={9} style={{ color: "rgba(255,255,255,0.5)" }} />
                        </button>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => updateSetValue(exIdx, setIdx, "weight", -5)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.07)" }}>
                          <Minus size={9} style={{ color: "rgba(255,255,255,0.5)" }} />
                        </button>
                        <span className="font-bold text-sm w-6 text-center text-white/90"
                          style={{ fontFamily: "'DM Mono', monospace" }}>{set.weight}</span>
                        <button onClick={() => updateSetValue(exIdx, setIdx, "weight", 5)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center"
                          style={{ background: "rgba(255,255,255,0.07)" }}>
                          <Plus size={9} style={{ color: "rgba(255,255,255,0.5)" }} />
                        </button>
                      </div>
                      <button onClick={() => toggleSet(exIdx, setIdx)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
                        style={{
                          background: set.completed ? "#22c55e" : "rgba(255,255,255,0.07)",
                          boxShadow: set.completed ? "0 2px 8px rgba(34,197,94,0.3)" : "none",
                        }}>
                        <Check size={14} style={{ color: set.completed ? "white" : "rgba(255,255,255,0.3)" }} />
                      </button>
                    </div>
                  ))}
                </div>
                {ex.substitutes.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-2">Substitutes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {ex.substitutes.map((s, si) => (
                        <span key={si} className="text-xs px-2.5 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.55)" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Notes & rating — always visible so user can fill in before tapping Complete */}
      <div className="space-y-3 pt-1">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Session notes (optional)..."
          className="w-full rounded-2xl p-4 text-sm resize-none outline-none text-white/70 placeholder-white/20"
          rows={2}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
          }}
        />
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/35">Rate this workout:</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(r => (
              <button key={r} onClick={() => setRating(r)} className="transition-transform active:scale-90">
                <Star size={20}
                  style={{
                    color: r <= rating ? "#f59e0b" : "rgba(255,255,255,0.15)",
                    fill: r <= rating ? "#f59e0b" : "none",
                  }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rest-day confirmation modal */}
      {confirmRestDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setConfirmRestDay(false)}>
          <div
            className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{
              background: "linear-gradient(135deg, #0c1f14, #0f2a1a)",
              border: "1px solid rgba(245,158,11,0.3)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(245,158,11,0.15)" }}>
                <RefreshCw size={18} style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                  This is a rest day
                </h3>
                <p className="text-xs text-white/40 mt-0.5">Do you still want to log a workout?</p>
              </div>
            </div>
            <p className="text-sm text-white/55 leading-relaxed">
              Rest days help your muscles recover and grow. Logging anyway will count toward your weekly stats.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRestDay(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>
                Cancel
              </button>
              <button
                onClick={doFinishSession}
                disabled={logSessionMutation.isPending}
                className="flex-1 py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #92400e, #f59e0b)",
                  opacity: logSessionMutation.isPending ? 0.7 : 1,
                }}>
                {logSessionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Log Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Strength Progression SVG Line Chart ───────────────────────────────────────

function StrengthLineChart({
  data, color = "#22c55e",
}: {
  data: Array<{ date: string; maxWeight: number }>;
  color?: string;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 text-white/25">
        <p className="text-xs text-center">Log at least 2 sessions with this exercise to see your trend</p>
      </div>
    );
  }

  const W = 320;
  const H = 110;
  const PAD = { top: 12, right: 16, bottom: 26, left: 38 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const weights = data.map(d => d.maxWeight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const rangeW = maxW - minW || 1;

  const points = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - ((d.maxWeight - minW) / rangeW) * chartH,
    weight: d.maxWeight,
    date: d.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  const yLabels = [minW, Math.round((minW + maxW) / 2), maxW];
  const xLabels = [
    { x: points[0].x, label: data[0].date.slice(5) },
    data.length > 2 ? { x: points[Math.floor(data.length / 2)].x, label: data[Math.floor(data.length / 2)].date.slice(5) } : null,
    { x: points[points.length - 1].x, label: data[data.length - 1].date.slice(5) },
  ].filter(Boolean) as Array<{ x: number; label: string }>;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 110 }}>
      <defs>
        <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yLabels.map((val, i) => {
        const y = PAD.top + chartH - ((val - minW) / rangeW) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3,3" />
            <text x={PAD.left - 5} y={y + 3.5} textAnchor="end" fontSize="8"
              fill="rgba(255,255,255,0.25)" style={{ fontFamily: "'DM Mono', monospace" }}>{val}</text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#strengthGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill={color} opacity="0.2" />
          <circle cx={p.x} cy={p.y} r="3" fill={color} stroke="#0a1f14" strokeWidth="1.5" />
        </g>
      ))}
      {xLabels.map((lbl, i) => (
        <text key={i} x={lbl.x} y={H - 3} textAnchor="middle" fontSize="8"
          fill="rgba(255,255,255,0.25)" style={{ fontFamily: "'DM Mono', monospace" }}>{lbl.label}</text>
      ))}
    </svg>
  );
}

// ── Analytics Tab ──────────────────────────────────────────────────────────────

const intensityColors: Record<string, string> = {
  increase: "#22c55e",
  maintain: "#3b82f6",
  deload: "#f59e0b",
  recovery: "#a855f7",
};
const intensityLabels: Record<string, string> = {
  increase: "↑ Increase Intensity",
  maintain: "→ Maintain Pace",
  deload: "↓ Deload Week",
  recovery: "♥ Recovery Focus",
};

function AnalyticsTab() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [aiCoaching, setAiCoaching] = useState<null | {
    overallAssessment: string;
    intensityRecommendation: string;
    strengthAdvice: string;
    recoveryAdvice: string;
    weekGoal: string;
    exercisesToSwap: Array<{ current: string; suggested: string; reason: string }>;
    sessionCount: number;
    stalledExercises: string[];
    progressingExercises: string[];
  }>(null);

  const { data: logs } = trpc.fitness.getLogs.useQuery(
    { startDate: thirtyDaysAgo, endDate: today },
    { enabled: !!user }
  );
  const { data: workoutSessions } = trpc.workout.getSessions.useQuery(
    { startDate: thirtyDaysAgo, endDate: today },
    { enabled: !!user }
  );
  const { data: trackedExercises } = trpc.workout.getTrackedExercises.useQuery(
    undefined,
    { enabled: !!user }
  );

  useEffect(() => {
    if (trackedExercises && trackedExercises.length > 0 && !selectedExercise) {
      setSelectedExercise(trackedExercises[0]);
    }
  }, [trackedExercises, selectedExercise]);

  const { data: progressionData, isLoading: progressionLoading } = trpc.workout.getStrengthProgression.useQuery(
    { exerciseName: selectedExercise ?? "" },
    { enabled: !!user && !!selectedExercise }
  );

  const aiCoachingMutation = trpc.workout.getAICoaching.useMutation({
    onSuccess: (data) => setAiCoaching(data),
    onError: () => toast.error("Could not load coaching advice. Try again."),
  });

  const oneYearAgo = new Date(Date.now() - 365 * 86400000).toISOString().split("T")[0];
  const { data: weightLogs } = trpc.fitness.getWeightLogs.useQuery(
    { startDate: oneYearAgo, endDate: today },
    { enabled: !!user }
  );

  const streak = useMemo(() => {
    if (!logs?.length) return 0;
    const dates = new Set(logs.map(l => l.date));
    let count = 0;
    const d = new Date();
    while (true) {
      const key = d.toISOString().split("T")[0];
      if (!dates.has(key)) break;
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [logs]);

  const weeklyCalories = useMemo(() => {
    if (!logs) return Array(7).fill(0);
    const result = Array(7).fill(0);
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split("T")[0];
      result[i] = logs.filter(l => l.date === key).reduce((s, l) => s + l.caloriesBurned, 0);
    }
    return result;
  }, [logs]);

  const estimated1RM = useMemo(() => {
    if (!progressionData || progressionData.length === 0) return null;
    const latest = progressionData[progressionData.length - 1];
    if (!latest.maxWeight || latest.maxWeight === 0) return null;
    return Math.round(latest.maxWeight * (1 + 8 / 30));
  }, [progressionData]);

  const maxBar = Math.max(...weeklyCalories, 1);
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const orderedLabels = (() => {
    const today = new Date().getDay();
    const offset = today === 0 ? 1 : today;
    return Array.from({ length: 7 }, (_, i) => dayLabels[(offset + i) % 7]);
  })();

  const totalWorkouts = logs?.length ?? 0;
  const totalCalories = logs?.reduce((s, l) => s + l.caloriesBurned, 0) ?? 0;
  const avgDuration = workoutSessions && workoutSessions.length > 0
    ? Math.round(workoutSessions.reduce((s, ws) => s + (ws.durationMin ?? 0), 0) / workoutSessions.length)
    : 0;

  if (!user) {
    return (
      <div className="px-4 py-16 flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.05)" }}>
          <Lock size={28} style={{ color: "rgba(255,255,255,0.2)" }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-white/60 mb-1">Sign in to track your progress</p>
          <p className="text-sm text-white/30">Your workout history and analytics will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-8 space-y-4">

      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Streak", value: `${streak}d`, icon: Zap, color: "#f59e0b" },
          { label: "Workouts", value: String(totalWorkouts), icon: Dumbbell, color: "#22c55e" },
          { label: "Avg Duration", value: avgDuration > 0 ? `${avgDuration}m` : "—", icon: Clock, color: "#3b82f6" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-3.5 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="w-7 h-7 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${color}15` }}>
              <Icon size={14} style={{ color }} />
            </div>
            <p className="font-bold text-lg text-white leading-none"
              style={{ fontFamily: "'DM Mono', monospace" }}>{value}</p>
            <p className="text-[10px] text-white/30 mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Weekly calories bar chart ── */}
      <div className="rounded-3xl p-5"
        style={{
          background: "linear-gradient(135deg, #0c3d2b 0%, #0f4a35 55%, #0a3224 100%)",
          border: "1px solid rgba(34,197,94,0.1)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
        }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-green-400/40 text-[10px] uppercase tracking-[0.18em]"
              style={{ fontFamily: "'DM Mono', monospace" }}>This Week</p>
            <p className="font-bold text-white text-base mt-0.5"
              style={{ fontFamily: "'Playfair Display', serif" }}>Calories Burned</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-xl text-white"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              {weeklyCalories.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30">total kcal</p>
          </div>
        </div>
        <div className="flex items-end gap-2 h-20">
          {weeklyCalories.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t-lg transition-all duration-700"
                style={{
                  height: `${Math.max((val / maxBar) * 64, val > 0 ? 4 : 0)}px`,
                  background: val > 0
                    ? "linear-gradient(180deg, #22c55e, #16a34a)"
                    : "rgba(255,255,255,0.05)",
                  boxShadow: val > 0 ? "0 -2px 8px rgba(34,197,94,0.2)" : "none",
                }} />
              <span className="text-[9px] text-white/25"
                style={{ fontFamily: "'DM Mono', monospace" }}>{orderedLabels[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Strength Progression ── */}
      <div className="rounded-3xl p-5"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.12)" }}>
              <TrendingUp size={15} style={{ color: "#22c55e" }} />
            </div>
            <div>
              <p className="font-semibold text-sm text-white/80">Strength Progression</p>
              {estimated1RM && (
                <p className="text-[10px] text-white/35 mt-0.5"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  Est. 1RM: <span style={{ color: "#4ade80" }}>{estimated1RM} lbs</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {trackedExercises && trackedExercises.length > 0 ? (
          <>
            {/* Exercise selector */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {trackedExercises.slice(0, 8).map(ex => (
                <button
                  key={ex}
                  onClick={() => setSelectedExercise(ex)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                  style={{
                    background: selectedExercise === ex
                      ? "linear-gradient(135deg, #14532d, #22c55e)"
                      : "rgba(255,255,255,0.06)",
                    color: selectedExercise === ex ? "white" : "rgba(255,255,255,0.45)",
                    border: selectedExercise === ex ? "none" : "1px solid rgba(255,255,255,0.09)",
                    boxShadow: selectedExercise === ex ? "0 2px 8px rgba(34,197,94,0.2)" : "none",
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            {progressionLoading ? (
              <div className="flex items-center justify-center h-28">
                <Loader2 size={20} className="animate-spin" style={{ color: "#22c55e" }} />
              </div>
            ) : (
              <StrengthLineChart data={progressionData ?? []} color="#22c55e" />
            )}

            {progressionData && progressionData.length >= 2 && (() => {
              const first = progressionData[0].maxWeight;
              const last = progressionData[progressionData.length - 1].maxWeight;
              const diff = last - first;
              const pct = first > 0 ? ((diff / first) * 100).toFixed(1) : "0";
              return (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: diff >= 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }}>
                    {diff >= 0
                      ? <ArrowUp size={11} style={{ color: "#22c55e" }} />
                      : <ArrowDown size={11} style={{ color: "#ef4444" }} />}
                  </div>
                  <span className="text-xs font-semibold" style={{ color: diff >= 0 ? "#4ade80" : "#ef4444" }}>
                    {diff >= 0 ? "+" : ""}{diff.toFixed(1)} lbs ({pct}%)
                  </span>
                  <span className="text-xs text-white/25 ml-auto"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    {progressionData.length} sessions
                  </span>
                </div>
              );
            })()}
          </>
        ) : (
          <div className="text-center py-8">
            <BarChart2 size={28} className="mx-auto mb-2.5" style={{ color: "rgba(255,255,255,0.12)" }} />
            <p className="text-xs text-white/30">
              Complete workouts in the Track tab to see your strength progression
            </p>
          </div>
        )}
      </div>

      {/* ── AI Coaching Panel ── */}
      <div className="rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(168,85,247,0.15)",
        }}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.15)" }}>
                <Brain size={15} style={{ color: "#a855f7" }} />
              </div>
              <div>
                <p className="font-semibold text-sm text-white/80">AI Coach</p>
                <p className="text-[10px] text-white/30 mt-0.5">Personalized analysis</p>
              </div>
            </div>
            {!aiCoaching ? (
              <button
                onClick={() => user ? aiCoachingMutation.mutate() : toast.error("Sign in to get AI coaching")}
                disabled={aiCoachingMutation.isPending}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: aiCoachingMutation.isPending
                    ? "rgba(168,85,247,0.1)"
                    : "linear-gradient(135deg, #6d28d9, #a855f7)",
                  color: aiCoachingMutation.isPending ? "#a855f7" : "white",
                  boxShadow: aiCoachingMutation.isPending ? "none" : "0 4px 16px rgba(168,85,247,0.25)",
                }}
              >
                {aiCoachingMutation.isPending ? (
                  <><Loader2 size={12} className="animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles size={12} /> How am I doing?</>
                )}
              </button>
            ) : (
              <button
                onClick={() => setAiCoaching(null)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg text-white/35"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                Refresh
              </button>
            )}
          </div>

          {!aiCoaching && !aiCoachingMutation.isPending && (
            <p className="text-xs leading-relaxed text-white/30">
              Get personalized coaching based on your last 14 days of workout data — intensity recommendations, stalled exercise advice, and a weekly goal.
            </p>
          )}

          {aiCoachingMutation.isPending && (
            <div className="flex items-center gap-3 py-4">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: "#a855f7", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <p className="text-xs text-white/35">
                Analyzing your {workoutSessions?.length ?? 0} recent sessions...
              </p>
            </div>
          )}

          {aiCoaching && (
            <div className="space-y-3.5">
              {/* Intensity badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{
                    background: `${intensityColors[aiCoaching.intensityRecommendation] ?? "#3b82f6"}18`,
                    color: intensityColors[aiCoaching.intensityRecommendation] ?? "#3b82f6",
                    border: `1px solid ${intensityColors[aiCoaching.intensityRecommendation] ?? "#3b82f6"}35`,
                  }}>
                  {intensityLabels[aiCoaching.intensityRecommendation] ?? aiCoaching.intensityRecommendation}
                </span>
              </div>

              {/* Assessment */}
              <div className="rounded-2xl p-3.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs leading-relaxed text-white/60">{aiCoaching.overallAssessment}</p>
              </div>

              {/* Advice cards */}
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { label: "Strength", content: aiCoaching.strengthAdvice, color: "#22c55e" },
                  { label: "Recovery", content: aiCoaching.recoveryAdvice, color: "#3b82f6" },
                  { label: "This Week's Goal", content: aiCoaching.weekGoal, color: "#f59e0b" },
                ].map(({ label, content, color }) => (
                  <div key={label} className="rounded-2xl p-3.5"
                    style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5"
                      style={{ color, fontFamily: "'DM Mono', monospace" }}>{label}</p>
                    <p className="text-xs leading-relaxed text-white/55">{content}</p>
                  </div>
                ))}
              </div>

              {/* Progressing / stalled */}
              {(aiCoaching.progressingExercises.length > 0 || aiCoaching.stalledExercises.length > 0) && (
                <div className="grid grid-cols-2 gap-2.5">
                  {aiCoaching.progressingExercises.length > 0 && (
                    <div className="rounded-2xl p-3"
                      style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: "#4ade80" }}>Progressing</p>
                      {aiCoaching.progressingExercises.map((e, i) => (
                        <p key={i} className="text-xs text-white/50 leading-relaxed">{e}</p>
                      ))}
                    </div>
                  )}
                  {aiCoaching.stalledExercises.length > 0 && (
                    <div className="rounded-2xl p-3"
                      style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2"
                        style={{ color: "#fb923c" }}>Stalled</p>
                      {aiCoaching.stalledExercises.map((e, i) => (
                        <p key={i} className="text-xs text-white/50 leading-relaxed">{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Suggested swaps */}
              {aiCoaching.exercisesToSwap.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2"
                    style={{ fontFamily: "'DM Mono', monospace" }}>Suggested Swaps</p>
                  <div className="space-y-2">
                    {aiCoaching.exercisesToSwap.map((swap, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-xl p-2.5"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span className="text-xs text-white/50 line-through flex-shrink-0">{swap.current}</span>
                        <ArrowRight size={11} style={{ color: "rgba(255,255,255,0.2)", marginTop: 2 }} />
                        <div>
                          <span className="text-xs text-white/75">{swap.suggested}</span>
                          <p className="text-[10px] text-white/30 mt-0.5">{swap.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Weight trend ── */}
      {weightLogs && weightLogs.length > 0 && (
        <div className="rounded-3xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.12)" }}>
              <Target size={15} style={{ color: "#3b82f6" }} />
            </div>
            <p className="font-semibold text-sm text-white/80">Weight Trend</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-2xl text-white"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                {parseFloat(weightLogs[0].weightRaw).toFixed(1)} {weightLogs[0].unit}
              </p>
              <p className="text-xs text-white/30 mt-0.5">Latest weight</p>
            </div>
            {(() => {
              const latest = parseFloat(weightLogs[0].weightRaw);
              const oldest = parseFloat(weightLogs[weightLogs.length - 1].weightRaw);
              const diff = latest - oldest;
              return (
                <div className="text-right">
                  <p className="font-bold text-xl"
                    style={{ color: diff > 0 ? "#f97316" : "#22c55e", fontFamily: "'DM Mono', monospace" }}>
                    {diff > 0 ? "+" : ""}{diff.toFixed(1)} {weightLogs[0].unit}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">Since first log</p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Recent activity ── */}
      {logs && logs.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3"
            style={{ fontFamily: "'DM Mono', monospace" }}>Recent Activity</p>
          <div className="space-y-2">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.1)" }}>
                  <Dumbbell size={15} style={{ color: "#22c55e" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white/80 truncate">{log.name}</p>
                  <p className="text-xs text-white/30 mt-0.5"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    {log.date} · {log.caloriesBurned} cal
                  </p>
                </div>
                {log.sets && (
                  <span className="text-xs text-white/30"
                    style={{ fontFamily: "'DM Mono', monospace" }}>
                    {log.sets}×{log.reps}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tracked sessions ── */}
      {workoutSessions && workoutSessions.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3"
            style={{ fontFamily: "'DM Mono', monospace" }}>Tracked Sessions</p>
          <div className="space-y-2">
            {workoutSessions.slice(0, 8).map(session => (
              <div key={session.id} className="flex items-center gap-3 p-3.5 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.1)" }}>
                  <Dumbbell size={15} style={{ color: "#22c55e" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white/80 truncate">{session.workoutName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-white/30"
                      style={{ fontFamily: "'DM Mono', monospace" }}>{session.date}</span>
                    {session.durationMin && (
                      <span className="text-xs text-white/25">· {session.durationMin}m</span>
                    )}
                    {session.caloriesBurned && (
                      <span className="text-xs text-white/25">· {session.caloriesBurned} cal</span>
                    )}
                  </div>
                </div>
                {session.rating && (
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: session.rating }).map((_, i) => (
                      <Star key={i} size={10} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FitnessPage() {
  const [setup, setSetup] = useState<FitnessSetup | null>(() => getFitnessSetup());
  const [activeTab, setActiveTab] = useState<"today" | "program" | "track" | "analytics">("today");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showReset, setShowReset] = useState(false);

  const goalConfig = FITNESS_GOALS.find(g => g.id === setup?.goal) ?? FITNESS_GOALS[0];

  const program = useMemo(() => {
    if (!setup) return null;
    return generateProgram(setup.goal, setup.frequency, setup.experience, setup.equipment, selectedWeek);
  }, [setup, selectedWeek]);

  const todayDayIndex = new Date().getDay();
  const adjustedIndex = todayDayIndex === 0 ? 6 : todayDayIndex - 1;
  const todayWorkout = program?.days[adjustedIndex % (program?.days.length ?? 7)];

  const handleSetupComplete = useCallback((s: FitnessSetup) => {
    setSetup(s);
  }, []);

  const handleReset = useCallback(() => {
    localStorage.removeItem(SETUP_KEY);
    setSetup(null);
    setShowReset(false);
  }, []);

  if (!setup) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  const tabIcons = {
    today: Calendar,
    program: Dumbbell,
    track: Activity,
    analytics: BarChart2,
  };

  return (
    <div className="min-h-screen pb-28"
      style={{ background: "linear-gradient(160deg, #070f0a 0%, #0a1f14 50%, #060d08 100%)" }}>

      {/* ── Premium Header ── */}
      <div className="px-5 pt-12 pb-2">
        {/* Back row */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => { hapticLight(); window.history.back(); }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setShowReset(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <RefreshCw size={14} style={{ color: "rgba(255,255,255,0.4)" }} />
          </button>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-green-400/35 text-[10px] uppercase tracking-[0.22em] mb-2"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              EatVera Fitness
            </p>
            <h1 className="text-white font-bold leading-tight"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: 26 }}>
              Your Fitness Plan
            </h1>
            <p className="text-white/30 text-sm mt-1">
              <span style={{ color: `${goalConfig.color}90` }}>{goalConfig.label}</span>
              {" · "}{setup.frequency}×/wk · {setup.experience}
            </p>
          </div>
        </div>

        {/* Week selector */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
              style={{
                background: selectedWeek === w
                  ? goalConfig.gradient
                  : "rgba(255,255,255,0.05)",
                color: selectedWeek === w ? "white" : "rgba(255,255,255,0.35)",
                border: selectedWeek === w ? "none" : "1px solid rgba(255,255,255,0.08)",
                boxShadow: selectedWeek === w ? `0 4px 12px ${goalConfig.color}25` : "none",
              }}
            >
              Wk {w}
            </button>
          ))}
        </div>

        {/* Week theme */}
        {program && (
          <div className="mt-3 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5"
            style={{ background: `${goalConfig.color}10`, border: `1px solid ${goalConfig.color}25` }}>
            <TrendingUp size={11} style={{ color: goalConfig.color }} />
            <span className="text-xs font-medium" style={{ color: `${goalConfig.color}cc` }}>
              Week {selectedWeek}: {program.theme}
            </span>
          </div>
        )}
      </div>

      {/* ── Premium Tab Bar ── */}
      <div className="px-4 mt-4 mb-4">
        <div className="flex gap-0.5 p-1 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["today", "program", "track", "analytics"] as const).map(tab => {
            const Icon = tabIcons[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
                style={{
                  background: isActive ? "rgba(255,255,255,0.09)" : "transparent",
                  color: isActive ? "white" : "rgba(255,255,255,0.35)",
                  boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.2)" : "none",
                }}
              >
                <Icon size={12} />
                {tab === "today" ? "Today" : tab === "program" ? "Plan" : tab === "track" ? "Track" : "Stats"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Today Tab ── */}
      {activeTab === "today" && todayWorkout && (
        <div className="px-4 space-y-4">
          {/* Hero card */}
          <div className="rounded-3xl p-5 relative overflow-hidden"
            style={{
              background: todayWorkout.type === "rest"
                ? "rgba(255,255,255,0.03)"
                : `linear-gradient(135deg, #0c3d2b 0%, #0f4a35 55%, #0a3224 100%)`,
              border: todayWorkout.type === "rest"
                ? "1px solid rgba(255,255,255,0.06)"
                : "1px solid rgba(34,197,94,0.15)",
              boxShadow: todayWorkout.type === "rest" ? "none" : "0 16px 48px rgba(0,0,0,0.4)",
            }}>
            {/* Decorative glow */}
            {todayWorkout.type !== "rest" && (
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }} />
            )}
            <div className="relative flex items-start gap-4">
              <WorkoutTypeIcon type={todayWorkout.type} size={18} />
              <div className="flex-1">
                <p className="text-green-400/40 text-[10px] uppercase tracking-[0.18em] mb-1"
                  style={{ fontFamily: "'DM Mono', monospace" }}>Today's Workout</p>
                <h2 className="font-bold text-xl text-white leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  {todayWorkout.name}
                </h2>
                {todayWorkout.type !== "rest" && (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs flex items-center gap-1 text-white/40">
                      <Clock size={11} /> {todayWorkout.duration} min
                    </span>
                    <span className="text-xs flex items-center gap-1 text-white/40">
                      <Flame size={11} /> ~{todayWorkout.estimatedCalories} cal
                    </span>
                    <span className="text-xs flex items-center gap-1 text-white/40">
                      <Repeat size={11} /> {todayWorkout.exercises.length} exercises
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {todayWorkout.type !== "rest" ? (
            <WorkoutDayCard day={todayWorkout} weekNum={selectedWeek} isToday />
          ) : (
            <div className="rounded-3xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="w-14 h-14 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(245,158,11,0.12)" }}>
                <Star size={26} style={{ color: "#f59e0b" }} />
              </div>
              <h3 className="font-bold text-xl text-white mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}>Rest Day</h3>
              <p className="text-sm text-white/40 leading-relaxed mb-4">
                Recovery is where your muscles grow. Stay hydrated, eat clean, and sleep well.
              </p>
              <div className="space-y-2 text-left">
                {mobilityTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span style={{ color: "#22c55e" }} className="text-xs mt-0.5">•</span>
                    <p className="text-xs text-white/40 leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progressive overload note */}
          {selectedWeek > 1 && todayWorkout.type !== "rest" && (
            <div className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.18)" }}>
              <TrendingUp size={15} style={{ color: "#f97316", flexShrink: 0, marginTop: 1 }} />
              <p className="text-xs leading-relaxed" style={{ color: "#fb923c" }}>
                <strong>Week {selectedWeek} Progressive Overload:</strong> Increase weight by ~{Math.round((selectedWeek - 1) * 5)}% compared to Week 1. If you can't, reduce reps by 1–2 and build back up.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Program Tab ── */}
      {activeTab === "program" && program && (
        <div className="px-4 space-y-3">
          {program.days.map((day, i) => (
            <WorkoutDayCard
              key={i}
              day={day}
              weekNum={selectedWeek}
              isToday={i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1) % program.days.length}
            />
          ))}
          <p className="text-center text-xs pb-4 text-white/15">
            EatVera provides general wellness guidance and is not medical advice.
          </p>
        </div>
      )}

      {/* ── Track Tab ── */}
      {activeTab === "track" && (
        <TrackTab program={program} selectedWeek={selectedWeek} />
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === "analytics" && <AnalyticsTab />}

      {/* ── Reset Modal ── */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-md rounded-t-3xl p-6"
            style={{ background: "#0a1f14", border: "1px solid rgba(255,255,255,0.08)", borderBottom: "none" }}>
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />
            <h3 className="font-bold text-xl text-white mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Reset Fitness Program?
            </h3>
            <p className="text-sm text-white/40 mb-6 leading-relaxed">
              This will clear your current program and let you set up a new one. Your workout logs will be preserved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white/60"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)" }}>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
