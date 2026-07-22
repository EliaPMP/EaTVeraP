/**
 * OnboardingPage — Premium conversational questionnaire
 * Design: Levels × WHOOP × Cal AI — botanical leaf background, dark forest green luxury
 * Conversational tone, animated progress bar, "why this matters" context, live calorie preview
 * Final shareable summary card
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Leaf,
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Dumbbell,
  Flame,
  Scale,
  Clock,
  User,
  ShieldCheck,
  Droplets,
  Wheat,
  TrendingUp,
  Minus,
  Plus,
  Zap,
  Heart,
  Download,
  Share2,
  Star,
  Activity,
  Apple,
} from "lucide-react";

// ─── Types & Storage ─────────────────────────────────────────────────────────

export interface BodyProfile {
  name: string;
  heightFeet: number;
  heightInches: number;
  currentWeightLbs: number;
  currentBuild: string;
  desiredBuild: string;
  mainGoal: string;
  desiredWeightLbs: number | null;
  timeframe: string;
  gender: string;
  age: number;
  archetype: string;
  eatingStyle: string;
  completedAt: number;
}

const STORAGE_KEY = "eatclean-body-profile";

export function getBodyProfile(): BodyProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveBodyProfile(profile: BodyProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  // Auto-sync calorie & macro goals whenever the profile is saved
  syncGoalsFromProfile(profile);
}

export function syncGoalsFromProfile(profile: BodyProfile): void {
  try {
    const { calculatePersonalizedGoals } = require("@/lib/calorieCalculator") as typeof import("@/lib/calorieCalculator");
    const goals = calculatePersonalizedGoals(profile);
    localStorage.setItem("eatclean-calorie-goals", JSON.stringify({
      dailyCalories: goals.dailyCalories,
      dailyProtein: goals.dailyProtein,
      dailyCarbs: goals.dailyCarbs,
      dailyFat: goals.dailyFat,
    }));
    localStorage.setItem("eatclean-goals-personalized", "1");
  } catch {}
}

export function hasCompletedOnboarding(): boolean {
  return getBodyProfile() !== null;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const GENDERS = [
  { value: "female", label: "Female", emoji: "♀" },
  { value: "male", label: "Male", emoji: "♂" },
  { value: "nonbinary", label: "Non-Binary", emoji: "⚧" },
  { value: "prefer_not", label: "Prefer not to say", emoji: "·" },
];

const EATING_STYLES = [
  { value: "omnivore", label: "Omnivore", emoji: "🍗", sub: "Eat everything — meat, dairy, plants" },
  { value: "vegetarian", label: "Vegetarian", emoji: "🥦", sub: "No meat, but dairy & eggs are fine" },
  { value: "vegan", label: "Vegan", emoji: "🌱", sub: "100% plant-based, no animal products" },
  { value: "pescatarian", label: "Pescatarian", emoji: "🐟", sub: "Fish & seafood, no other meat" },
  { value: "keto", label: "Keto", emoji: "🥑", sub: "High fat, very low carb" },
  { value: "paleo", label: "Paleo", emoji: "🍖", sub: "Whole foods, no grains or dairy" },
  { value: "mediterranean", label: "Mediterranean", emoji: "🫒", sub: "Olive oil, fish, veggies, legumes" },
  { value: "carnivore", label: "Carnivore", emoji: "🥩", sub: "Meat-only, zero plant foods" },
];

const ARCHETYPES = [
  {
    value: "lose_fat",
    label: "Lose Fat",
    sub: "Burn body fat, reveal definition",
    icon: Flame,
    color: "#f97316",
    gradient: "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(234,88,12,0.08))",
    border: "rgba(249,115,22,0.35)",
    glow: "rgba(249,115,22,0.25)",
  },
  {
    value: "build_muscle",
    label: "Build Muscle",
    sub: "Gain lean mass and strength",
    icon: Dumbbell,
    color: "#4ade80",
    gradient: "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(34,197,94,0.08))",
    border: "rgba(74,222,128,0.35)",
    glow: "rgba(74,222,128,0.25)",
  },
  {
    value: "maintain",
    label: "Maintain & Optimize",
    sub: "Stay lean, eat cleaner, feel better",
    icon: Target,
    color: "#a78bfa",
    gradient: "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(139,92,246,0.08))",
    border: "rgba(167,139,250,0.35)",
    glow: "rgba(167,139,250,0.25)",
  },
  {
    value: "recomp",
    label: "Body Recomposition",
    sub: "Lose fat while gaining muscle",
    icon: TrendingUp,
    color: "#38bdf8",
    gradient: "linear-gradient(135deg, rgba(56,189,248,0.18), rgba(14,165,233,0.08))",
    border: "rgba(56,189,248,0.35)",
    glow: "rgba(56,189,248,0.25)",
  },
  {
    value: "performance",
    label: "Athletic Performance",
    sub: "Fuel for sport and endurance",
    icon: Zap,
    color: "#fbbf24",
    gradient: "linear-gradient(135deg, rgba(251,191,36,0.18), rgba(245,158,11,0.08))",
    border: "rgba(251,191,36,0.35)",
    glow: "rgba(251,191,36,0.25)",
  },
];

const CURRENT_BUILDS = [
  { value: "slim", label: "Slim", sub: "Lean frame, low body mass" },
  { value: "average", label: "Average", sub: "Typical build for my height" },
  { value: "athletic", label: "Athletic", sub: "Active, defined muscle tone" },
  { value: "skinny_fat", label: "Skinny Fat", sub: "Thin but soft, low muscle" },
  { value: "overweight", label: "Overweight", sub: "Carrying extra body fat" },
  { value: "muscular", label: "Muscular", sub: "Strong, well-built physique" },
  { value: "bigger_build", label: "Bigger Build", sub: "Large frame, heavy set" },
];

const DESIRED_BUILDS = [
  { value: "lean_athletic", label: "Lean & Athletic", sub: "Defined, functional physique" },
  { value: "bigger_muscular", label: "Bigger & Muscular", sub: "Size and strength combined" },
  { value: "slim_toned", label: "Slim & Toned", sub: "Light and sculpted" },
  { value: "lose_fat", label: "Lose Fat", sub: "Reduce body fat percentage" },
  { value: "maintain_muscle_lose_weight", label: "Maintain Muscle, Lose Weight", sub: "Recomp — keep muscle, shed fat" },
  { value: "bulk_build_muscle", label: "Bulk / Build Muscle", sub: "Maximize muscle growth" },
  { value: "maintain_current", label: "Maintain Current Build", sub: "Stay where I am" },
];

const MAIN_GOALS = [
  { value: "build_muscle", label: "Build Muscle", sub: "Gain lean mass and strength", icon: Dumbbell },
  { value: "lose_fat", label: "Lose Fat", sub: "Reduce body fat percentage", icon: Flame },
  { value: "maintain_muscle_lose_weight", label: "Maintain Muscle While Losing Weight", sub: "Recomp — keep muscle, shed fat", icon: TrendingUp },
  { value: "maintain_weight", label: "Maintain Current Weight", sub: "Stay consistent", icon: Target },
  { value: "clean_eating", label: "Improve Food Quality", sub: "Eat cleaner, avoid toxins", icon: Leaf },
];

const TIMEFRAMES = [
  { value: "1_month", label: "1 Month", sub: "Aggressive, short sprint" },
  { value: "3_months", label: "3 Months", sub: "Focused, achievable" },
  { value: "6_months", label: "6 Months", sub: "Steady, sustainable" },
  { value: "1_year", label: "1 Year", sub: "Long-term transformation" },
  { value: "no_timeframe", label: "No Specific Timeframe", sub: "I'll go at my own pace" },
];

// ─── Calorie calculation ──────────────────────────────────────────────────────

function calcLiveCalories(
  weightLbs: number,
  heightFeet: number,
  heightInches: number,
  age: number,
  gender: string,
  currentBuild: string,
  archetype: string,
  mainGoal: string,
): { calories: number; protein: number; carbs: number; fat: number; tdee: number } | null {
  if (!weightLbs || !heightFeet) return null;
  const weightKg = weightLbs * 0.453592;
  const heightCm = (heightFeet * 12 + heightInches) * 2.54;
  const a = age || 30;

  // Mifflin-St Jeor with gender
  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * a + 5;
  } else if (gender === "female") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * a - 161;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * a - 78;
  }

  const activityMap: Record<string, number> = {
    athletic: 1.55, muscular: 1.55, slim: 1.375, average: 1.375,
    skinny_fat: 1.2, overweight: 1.2, bigger_build: 1.2,
  };
  const activity = activityMap[currentBuild] ?? 1.375;
  const tdee = Math.round(bmr * activity);

  const goal = archetype || mainGoal;
  const adjustMap: Record<string, number> = {
    lose_fat: -400, slim_toned: -400,
    maintain_muscle_lose_weight: -250, recomp: -200,
    build_muscle: 350, bigger_muscular: 350, bulk_build_muscle: 350,
    lean_athletic: 100, performance: 200,
  };
  const adj = adjustMap[goal] ?? 0;
  const calories = Math.max(1200, Math.round(tdee + adj));

  const proteinPerLb = goal === "lose_fat" || goal === "maintain_muscle_lose_weight" || goal === "recomp" ? 1.0 : 0.85;
  const protein = Math.round(weightLbs * proteinPerLb);
  const remaining = calories - protein * 4;
  const carbs = Math.round((remaining * 0.55) / 4);
  const fat = Math.round((remaining * 0.45) / 9);

  return { calories, protein, carbs, fat, tdee };
}

// ─── Plan generation ──────────────────────────────────────────────────────────

function generatePlan(profile: BodyProfile): string[] {
  const tips: string[] = [];
  const goal = profile.archetype || profile.mainGoal;
  if (goal === "build_muscle" || profile.desiredBuild === "bigger_muscular" || profile.desiredBuild === "bulk_build_muscle") {
    tips.push("Prioritize protein — aim for 0.7–1g per lb of body weight daily");
    tips.push("Eat in a calorie surplus to support muscle growth");
    tips.push("Focus on whole-food protein sources: eggs, meat, dairy");
  }
  if (goal === "lose_fat" || profile.desiredBuild === "lose_fat") {
    tips.push("Eat in a moderate calorie deficit (250–500 cal/day)");
    tips.push("Prioritize protein to preserve muscle while cutting");
    tips.push("Avoid ultra-processed foods and liquid calories");
  }
  if (goal === "recomp" || goal === "maintain_muscle_lose_weight" || profile.desiredBuild === "maintain_muscle_lose_weight") {
    tips.push("Maintain high protein intake to protect muscle mass");
    tips.push("Eat in a small calorie deficit — don't cut too aggressively");
    tips.push("Prioritize strength training alongside clean eating");
  }
  if (goal === "clean_eating" || goal === "maintain") {
    tips.push("Scan every product before buying — know what's in your food");
    tips.push("Avoid the 8 inflammatory seed oils (canola, corn, soy, etc.)");
    tips.push("Shop the perimeter of the grocery store for whole foods");
  }
  if (goal === "performance") {
    tips.push("Fuel workouts with complex carbs 1–2 hours before training");
    tips.push("Prioritize recovery nutrition within 30 min post-workout");
    tips.push("Stay hydrated — aim for 0.5–1 oz of water per lb of body weight");
  }
  tips.push("Avoid ultra-processed foods with more than 5 ingredients");
  tips.push("Avoid seed oils — check every label with EatVera");
  return tips.slice(0, 5);
}

// ─── Leaf Background Wrapper ──────────────────────────────────────────────────

const LEAF_BG_URL = "/manus-storage/onboarding-leaf-bg-v2_9df4306d.png";

function LeafBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col overflow-hidden">
      {/* Botanical leaf photo */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${LEAF_BG_URL})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* Subtle overlay — image is already dark, just a light vignette for text readability */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, rgba(2,12,6,0.45) 0%, rgba(4,18,10,0.30) 50%, rgba(2,10,5,0.50) 100%)",
        }}
      />
      {/* Subtle green ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(34,197,94,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
}

// ─── Animated Step Wrapper ────────────────────────────────────────────────────

function AnimatedStep({ children, stepKey, direction }: { children: React.ReactNode; stepKey: number; direction: "forward" | "back" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);
  const fromX = direction === "forward" ? "24px" : "-24px";
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0) translateY(0)" : `translateX(${fromX}) translateY(8px)`,
        transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Premium Progress Bar ─────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #22c55e, #4ade80)",
            boxShadow: "0 0 8px rgba(74,222,128,0.5)",
          }}
        />
      </div>
      <span className="text-[11px] font-mono text-white/40 flex-shrink-0">{step + 1}/{total}</span>
    </div>
  );
}

// ─── Selection Card ───────────────────────────────────────────────────────────

function SelectCard({
  selected,
  onClick,
  label,
  sub,
  icon: Icon,
  index,
  accentColor,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  sub?: string;
  icon?: React.ElementType;
  index: number;
  accentColor?: string;
}) {
  const accent = accentColor || "#4ade80";
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-200 active:scale-[0.98]"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div
        className="relative flex items-center gap-3.5 px-4 py-3.5 rounded-2xl overflow-hidden"
        style={{
          background: selected
            ? `linear-gradient(135deg, ${accent}22 0%, ${accent}0d 100%)`
            : "rgba(255,255,255,0.05)",
          border: selected
            ? `1px solid ${accent}55`
            : "1px solid rgba(255,255,255,0.09)",
          boxShadow: selected
            ? `0 0 0 1px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.08)`
            : "inset 0 1px 0 rgba(255,255,255,0.04)",
          backdropFilter: "blur(16px)",
        }}
      >
        {selected && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)",
            }}
          />
        )}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200"
          style={{
            background: selected ? `${accent}28` : "rgba(255,255,255,0.06)",
            border: selected ? `1px solid ${accent}44` : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {selected ? (
            <Check size={14} style={{ color: accent }} strokeWidth={2.5} />
          ) : Icon ? (
            <Icon size={14} style={{ color: "rgba(255,255,255,0.35)" }} strokeWidth={1.8} />
          ) : (
            <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight" style={{ color: selected ? "#f0fdf4" : "rgba(255,255,255,0.82)" }}>
            {label}
          </p>
          {sub && (
            <p className="text-[11px] mt-0.5 leading-tight" style={{ color: selected ? `${accent}99` : "rgba(255,255,255,0.35)" }}>
              {sub}
            </p>
          )}
        </div>
        {selected && (
          <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}99)` }} />
        )}
      </div>
    </button>
  );
}

// ─── Stepper Input ────────────────────────────────────────────────────────────

function StepperInput({
  value, onDecrement, onIncrement, unit, min, max,
}: {
  value: number; onDecrement: () => void; onIncrement: () => void;
  unit: string; min: number; max: number;
}) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={onDecrement}
        disabled={value <= min}
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
        style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
      >
        <Minus size={18} style={{ color: "rgba(255,255,255,0.7)" }} strokeWidth={2} />
      </button>
      <div className="text-center min-w-[90px]">
        <span
          className="font-bold text-6xl text-white"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em" }}
        >
          {value}
        </span>
        <span className="text-white/40 text-xl ml-2 font-medium">{unit}</span>
      </div>
      <button
        onClick={onIncrement}
        disabled={value >= max}
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
        style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)", backdropFilter: "blur(8px)" }}
      >
        <Plus size={18} style={{ color: "#4ade80" }} strokeWidth={2} />
      </button>
    </div>
  );
}

// ─── "Why this matters" pill ──────────────────────────────────────────────────

function WhyMatters({ text }: { text: string }) {
  return (
    <div
      className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl mb-6"
      style={{
        background: "rgba(74,222,128,0.07)",
        border: "1px solid rgba(74,222,128,0.15)",
        backdropFilter: "blur(8px)",
      }}
    >
      <Leaf size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#4ade80" }} />
      <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
        <span style={{ color: "rgba(74,222,128,0.8)" }}>Why this matters: </span>
        {text}
      </p>
    </div>
  );
}

// ─── Live Calorie Preview Banner ──────────────────────────────────────────────

function CalorieBanner({
  calories, protein, carbs, fat,
}: { calories: number; protein: number; carbs: number; fat: number }) {
  return (
    <div
      className="rounded-2xl p-4 mb-4"
      style={{
        background: "linear-gradient(135deg, rgba(74,222,128,0.12) 0%, rgba(34,197,94,0.06) 100%)",
        border: "1px solid rgba(74,222,128,0.2)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(74,222,128,0.1)",
      }}
    >
      <p className="text-[10px] font-mono tracking-[0.15em] uppercase mb-3" style={{ color: "rgba(74,222,128,0.6)" }}>
        Your Estimated Daily Targets
      </p>
      <div className="flex items-end gap-1 mb-3">
        <span
          className="text-4xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em" }}
        >
          {calories.toLocaleString()}
        </span>
        <span className="text-sm text-white/40 mb-1.5 ml-1">kcal / day</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Protein", value: `${protein}g`, color: "#4ade80" },
          { label: "Carbs", value: `${carbs}g`, color: "#38bdf8" },
          { label: "Fat", value: `${fat}g`, color: "#fbbf24" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl px-2.5 py-2 text-center"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
            <p className="text-sm font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step config ──────────────────────────────────────────────────────────────

interface StepConfig {
  title: string;
  conversational: string;
  why: string;
}

const STEP_CONFIGS: StepConfig[] = [
  {
    title: "What should we call you?",
    conversational: "Let's make this personal.",
    why: "We'll use your name to personalize your plan, recommendations, and progress updates.",
  },
  {
    title: "How do you identify?",
    conversational: "Let's start with you.",
    why: "Gender affects your BMR calculation, giving you more accurate calorie and macro targets.",
  },
  {
    title: "What is your height?",
    conversational: "Tell me about your body.",
    why: "Height is the foundation of every nutrition formula — it determines your baseline energy needs.",
  },
  {
    title: "What is your current weight?",
    conversational: "Be honest — this is just for you.",
    why: "Weight drives your protein targets and calorie calculations. No judgment here.",
  },
  {
    title: "How old are you?",
    conversational: "Age shapes your metabolism.",
    why: "Metabolic rate naturally changes with age. This makes your calorie targets precise, not generic.",
  },
  {
    title: "Describe your current build.",
    conversational: "Where are you starting from?",
    why: "Your current build helps us estimate your activity level and set a realistic starting point.",
  },
  {
    title: "What's your primary goal?",
    conversational: "What are you here to do?",
    why: "Your archetype determines your calorie surplus or deficit, macro split, and workout frequency.",
  },
  {
    title: "What build are you aiming for?",
    conversational: "Paint me a picture of success.",
    why: "Your desired physique fine-tunes your macro ratios and helps us pick the right workout program.",
  },
  {
    title: "What is your main focus?",
    conversational: "Let's get specific.",
    why: "This drives your personalized food guidance, scan alerts, and daily recommendations.",
  },
  {
    title: "What's your target weight?",
    conversational: "Optional — skip if unsure.",
    why: "A target weight helps us calculate your weekly deficit/surplus and estimated timeline.",
  },
  {
    title: "What's your timeframe?",
    conversational: "Realistic timelines win.",
    why: "Knowing your timeframe lets us calibrate the intensity of your plan — no crash diets.",
  },
  {
    title: "Pick a way of eating.",
    conversational: "We'll filter recommendations to match.",
    why: "Your eating style shapes which ingredients we flag, which products we recommend, and how we score your scans.",
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

interface OnboardingPageProps {
  onComplete?: () => void;
  isEditing?: boolean;
}

export default function OnboardingPage({ onComplete, isEditing = false }: OnboardingPageProps) {
  const [, navigate] = useLocation();
  const existing = getBodyProfile();

  // Read optional ?step=N query param to jump directly to a specific step
  const initialStep = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const s = parseInt(params.get("step") ?? "", 10);
      return isNaN(s) ? 0 : s;
    } catch { return 0; }
  })();

  // Skip welcome screen only when explicitly retaking quiz from Settings (isEditing)
  // New users always see the welcome splash first, even if a partial profile exists
  const isRetake = isEditing;
  const [showWelcome, setShowWelcome] = useState(!isRetake && initialStep === 0);
  const [step, setStep] = useState(initialStep);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [name, setName] = useState(existing?.name ?? "");
  const [gender, setGender] = useState(existing?.gender ?? "");
  const [heightFeet, setHeightFeet] = useState(existing?.heightFeet ?? 5);
  const [heightInches, setHeightInches] = useState(existing?.heightInches ?? 8);
  // ── Weight unit preference (synced with Progress page via localStorage) ──
  const [weightUnit, setWeightUnit] = useState<"lbs" | "kg">(() => {
    try { return localStorage.getItem("eatvera-weight-unit") === "kg" ? "kg" : "lbs"; } catch { return "lbs"; }
  });
  const switchWeightUnit = (unit: "lbs" | "kg") => {
    setWeightUnit(unit);
    try { localStorage.setItem("eatvera-weight-unit", unit); } catch {}
    // Convert current weight value when switching units
    if (currentWeight && !isNaN(Number(currentWeight)) && Number(currentWeight) > 0) {
      const v = Number(currentWeight);
      if (unit === "kg" && weightUnit === "lbs") setCurrentWeight((Math.round(v * 0.453592 * 10) / 10).toString());
      if (unit === "lbs" && weightUnit === "kg") setCurrentWeight((Math.round(v * 2.20462 * 10) / 10).toString());
    }
    if (desiredWeight && !isNaN(Number(desiredWeight)) && Number(desiredWeight) > 0) {
      const v = Number(desiredWeight);
      if (unit === "kg" && weightUnit === "lbs") setDesiredWeight((Math.round(v * 0.453592 * 10) / 10).toString());
      if (unit === "lbs" && weightUnit === "kg") setDesiredWeight((Math.round(v * 2.20462 * 10) / 10).toString());
    }
  };

  const [currentWeight, setCurrentWeight] = useState(() => {
    if (existing?.currentWeightLbs) {
      const savedUnit = (() => { try { return localStorage.getItem("eatvera-weight-unit"); } catch { return null; } })();
      if (savedUnit === "kg") return (Math.round(existing.currentWeightLbs * 0.453592 * 10) / 10).toString();
    }
    return existing?.currentWeightLbs?.toString() ?? "";
  });
  const [age, setAge] = useState(existing?.age ?? 28);
  const [currentBuild, setCurrentBuild] = useState(existing?.currentBuild ?? "");
  const [archetype, setArchetype] = useState(existing?.archetype ?? "");
  const [desiredBuild, setDesiredBuild] = useState(existing?.desiredBuild ?? "");
  const [mainGoal, setMainGoal] = useState(existing?.mainGoal ?? "");
  const [desiredWeight, setDesiredWeight] = useState(() => {
    if (existing?.desiredWeightLbs) {
      const savedUnit = (() => { try { return localStorage.getItem("eatvera-weight-unit"); } catch { return null; } })();
      if (savedUnit === "kg") return (Math.round(existing.desiredWeightLbs * 0.453592 * 10) / 10).toString();
    }
    return existing?.desiredWeightLbs?.toString() ?? "";
  });
  const [timeframe, setTimeframe] = useState(existing?.timeframe ?? "");
  const [eatingStyle, setEatingStyle] = useState(existing?.eatingStyle ?? "");
  const [showPlan, setShowPlan] = useState(false);
  const [savedProfile, setSavedProfile] = useState<BodyProfile | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const TOTAL_STEPS = STEP_CONFIGS.length;

  // Live calorie estimate
  const liveCalories = calcLiveCalories(
    Number(currentWeight) || 0,
    heightFeet,
    heightInches,
    age,
    gender,
    currentBuild,
    archetype,
    mainGoal,
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function canAdvance(): boolean {
    switch (step) {
      case 0: return name.trim().length >= 1;  // name
      case 1: return gender !== "";             // gender
      case 2: return heightFeet >= 3 && heightFeet <= 8; // height
      case 3: return currentWeight.trim() !== "" && !isNaN(Number(currentWeight)) && Number(currentWeight) > 0; // weight
      case 4: return age >= 13 && age <= 100;   // age
      case 5: return currentBuild !== "";       // current build
      case 6: return archetype !== "";          // archetype
      case 7: return desiredBuild !== "";       // desired build
      case 8: return mainGoal !== "";           // main goal
      case 9: return true;                      // target weight (optional)
      case 10: return timeframe !== "";         // timeframe
      case 11: return eatingStyle !== "";       // eating style
      default: return false;
    }
  }

  function handleNext() {
    setDirection("forward");
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1);
    } else {
      const profile: BodyProfile = {
        name: name.trim(),
        gender,
        heightFeet,
        heightInches,
        // Always store in lbs in the profile regardless of input unit
        currentWeightLbs: weightUnit === "kg" ? Math.round(Number(currentWeight) * 2.20462 * 10) / 10 : Number(currentWeight),
        age,
        currentBuild,
        archetype,
        desiredBuild,
        mainGoal,
        desiredWeightLbs: desiredWeight.trim() !== "" && !isNaN(Number(desiredWeight))
          ? (weightUnit === "kg" ? Math.round(Number(desiredWeight) * 2.20462 * 10) / 10 : Number(desiredWeight))
          : null,
        timeframe,
        eatingStyle,
        completedAt: Date.now(),
      };
      saveBodyProfile(profile);
      setSavedProfile(profile);
      setShowPlan(true);
    }
  }

  function handleBack() {
    setDirection("back");
    if (step > 0) setStep(s => s - 1);
  }

  function handleFinish() {
    // If a returnTo query param is set (e.g. ?step=9&returnTo=/progress), go there after saving
    const returnTo = (() => {
      try { return new URLSearchParams(window.location.search).get("returnTo"); } catch { return null; }
    })();
    if (onComplete) onComplete();
    else if (returnTo) navigate(returnTo);
    else navigate("/");
  }

  const cfg = STEP_CONFIGS[step];

  // ── Welcome Screen ───────────────────────────────────────────────────────
  if (showWelcome) {
    return (
      <div className="fixed inset-0 z-[9998] flex flex-col overflow-hidden">
        {/* Botanical leaf background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${LEAF_BG_URL})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlay — light vignette, image is already dark */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(2,10,5,0.50) 0%, rgba(4,18,10,0.25) 40%, rgba(2,10,5,0.55) 100%)",
          }}
        />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(34,197,94,0.12) 0%, transparent 70%)", filter: "blur(40px)" }}
        />

        <div className="relative z-10 flex flex-col h-full max-w-md mx-auto w-full px-6 pt-16 pb-10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-12">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(74,222,128,0.3), rgba(34,197,94,0.15))", border: "1px solid rgba(74,222,128,0.35)" }}
            >
              <Leaf size={17} style={{ color: "#4ade80" }} />
            </div>
            <span
              className="text-white font-bold text-xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}
            >
              EatVera
            </span>
          </div>

          {/* Hero text */}
          <div className="mb-10">
            <h1
              className="font-bold leading-tight mb-4"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2.2rem, 9vw, 2.8rem)",
                letterSpacing: "-0.02em",
                color: "white",
              }}
            >
              Welcome to{" "}
              <span style={{ color: "#c8e6a0", fontStyle: "italic" }}>EatVera</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
              Let's build the cleanest, most personalized way to eat for your body — in under 60 seconds.
            </p>
          </div>

          {/* Feature checklist */}
          <div className="space-y-3 mb-auto">
            {[
              "10 quick questions",
              "Personalized calorie & macro targets",
              "AI-powered food guidance",
              "Ingredient scanner & safety alerts",
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(16px)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(74,222,128,0.2)", border: "1px solid rgba(74,222,128,0.3)" }}
                >
                  <Check size={12} style={{ color: "#4ade80" }} strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.82)" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-8 space-y-3">
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #c8e6a0 0%, #a3c97a 100%)",
                color: "#0a2010",
                boxShadow: "0 4px 32px rgba(164,201,122,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
                letterSpacing: "0.01em",
              }}
            >
              Start Personalizing
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={handleFinish}
              className="w-full py-3 text-sm font-medium transition-all"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              I'll do this later
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Plan Summary / Final Card ─────────────────────────────────────────────
  if (showPlan && savedProfile) {
    const plan = generatePlan(savedProfile);
    const archetypeData = ARCHETYPES.find(a => a.value === savedProfile.archetype);
    const mainGoalLabel = MAIN_GOALS.find(g => g.value === savedProfile.mainGoal)?.label ?? savedProfile.mainGoal;
    const timeframeLabel = TIMEFRAMES.find(t => t.value === savedProfile.timeframe)?.label ?? savedProfile.timeframe;
    const desiredBuildLabel = DESIRED_BUILDS.find(b => b.value === savedProfile.desiredBuild)?.label ?? savedProfile.desiredBuild;

    const finalCalories = calcLiveCalories(
      savedProfile.currentWeightLbs,
      savedProfile.heightFeet,
      savedProfile.heightInches,
      savedProfile.age,
      savedProfile.gender,
      savedProfile.currentBuild,
      savedProfile.archetype,
      savedProfile.mainGoal,
    );

    const workoutFreq = savedProfile.archetype === "build_muscle" || savedProfile.archetype === "performance"
      ? "4–5 days / week"
      : savedProfile.archetype === "lose_fat" || savedProfile.archetype === "recomp"
      ? "3–4 days / week"
      : "3 days / week";

    const tipIcons: Record<string, React.ElementType> = {
      "Prioritize protein": Dumbbell,
      "Eat in a calorie surplus": TrendingUp,
      "Focus on whole-food": ShieldCheck,
      "Eat in a moderate calorie deficit": Flame,
      "Prioritize protein to preserve": Dumbbell,
      "Avoid ultra-processed foods and liquid": ShieldCheck,
      "Maintain high protein": Dumbbell,
      "Eat in a small calorie deficit": Flame,
      "Prioritize strength training": Dumbbell,
      "Scan every product": Target,
      "Avoid the 8 inflammatory": Droplets,
      "Shop the perimeter": Wheat,
      "Maintain consistent": Scale,
      "Prioritize whole foods": ShieldCheck,
      "Avoid ultra-processed foods with": ShieldCheck,
      "Avoid seed oils": Droplets,
      "Fuel workouts": Zap,
      "Prioritize recovery": Heart,
      "Stay hydrated": Droplets,
    };
    const getTipIcon = (tip: string): React.ElementType => {
      for (const [key, Icon] of Object.entries(tipIcons)) {
        if (tip.startsWith(key)) return Icon;
      }
      return Check;
    };

    return (
      <LeafBackground>
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-14 pb-16 max-w-md mx-auto w-full">

            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{ background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.2)" }}
              >
                <Star size={12} style={{ color: "#4ade80" }} />
                <span className="text-[11px] font-mono tracking-[0.12em] uppercase" style={{ color: "rgba(74,222,128,0.8)" }}>
                  Your Profile is Ready
                </span>
              </div>
              <h1
                className="text-white font-bold leading-tight mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem,6vw,2rem)", letterSpacing: "-0.02em" }}
              >
                Your EatVera Plan
              </h1>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                Personalized to your body, goals, and lifestyle.
              </p>
            </div>

            {/* Archetype badge */}
            {archetypeData && (
              <div
                className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                style={{
                  background: archetypeData.gradient,
                  border: `1px solid ${archetypeData.border}`,
                  backdropFilter: "blur(16px)",
                  boxShadow: `0 4px 24px ${archetypeData.glow}`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${archetypeData.color}22`, border: `1px solid ${archetypeData.color}44` }}
                >
                  <archetypeData.icon size={20} style={{ color: archetypeData.color }} />
                </div>
                <div>
                  <p className="text-[10px] font-mono tracking-wider uppercase mb-0.5" style={{ color: `${archetypeData.color}88` }}>
                    Your Archetype
                  </p>
                  <p className="text-base font-bold text-white">{archetypeData.label}</p>
                </div>
              </div>
            )}

            {/* Calorie targets card */}
            {finalCalories && (
              <div
                className="rounded-3xl p-5 mb-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                <p className="text-[10px] font-mono tracking-[0.15em] uppercase mb-4" style={{ color: "rgba(74,222,128,0.6)" }}>
                  Daily Nutrition Targets
                </p>
                <div className="flex items-end gap-2 mb-4">
                  <span
                    className="text-5xl font-bold text-white"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.03em" }}
                  >
                    {finalCalories.calories.toLocaleString()}
                  </span>
                  <span className="text-sm text-white/40 mb-2">kcal / day</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { label: "Protein", value: `${finalCalories.protein}g`, color: "#4ade80", sub: "muscle" },
                    { label: "Carbs", value: `${finalCalories.carbs}g`, color: "#38bdf8", sub: "energy" },
                    { label: "Fat", value: `${finalCalories.fat}g`, color: "#fbbf24", sub: "hormones" },
                  ].map(({ label, value, color, sub }) => (
                    <div
                      key={label}
                      className="rounded-2xl p-3 text-center"
                      style={{ background: `${color}0f`, border: `1px solid ${color}22` }}
                    >
                      <p className="text-xs font-bold mb-0.5" style={{ color }}>{value}</p>
                      <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                      <p className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{sub}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Maintenance</p>
                    <p className="text-sm font-semibold text-white">{finalCalories.tdee.toLocaleString()} kcal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Workout Freq</p>
                    <p className="text-sm font-semibold text-white">{workoutFreq}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile summary */}
            <div
              className="rounded-3xl p-5 mb-4"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <p className="text-[10px] font-mono tracking-[0.15em] uppercase mb-4" style={{ color: "rgba(74,222,128,0.6)" }}>
                Body Profile
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: User, label: "Height", value: `${savedProfile.heightFeet}'${savedProfile.heightInches}"` },
                  { icon: Scale, label: "Weight", value: `${savedProfile.currentWeightLbs} lbs` },
                  { icon: Activity, label: "Build", value: CURRENT_BUILDS.find(b => b.value === savedProfile.currentBuild)?.label ?? savedProfile.currentBuild },
                  { icon: Target, label: "Goal", value: mainGoalLabel },
                  { icon: Dumbbell, label: "Desired Build", value: desiredBuildLabel },
                  { icon: Clock, label: "Timeframe", value: timeframeLabel },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} style={{ color: "rgba(74,222,128,0.5)" }} />
                      <span className="text-[10px] font-mono tracking-wider uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
                    </div>
                    <p className="text-white text-sm font-semibold leading-tight">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Focus tips */}
            <div
              className="rounded-3xl p-5 mb-5"
              style={{
                background: "linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(34,197,94,0.04) 100%)",
                border: "1px solid rgba(74,222,128,0.18)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(74,222,128,0.08)",
              }}
            >
              <p className="text-[10px] font-mono tracking-[0.15em] uppercase mb-4" style={{ color: "rgba(74,222,128,0.6)" }}>
                Your Personalized Focus
              </p>
              <div className="space-y-3">
                {plan.map((tip, i) => {
                  const TipIcon = getTipIcon(tip);
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.2)" }}
                      >
                        <TipIcon size={13} style={{ color: "#4ade80" }} />
                      </div>
                      <p className="text-sm leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>{tip}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Screenshot hint */}
            <div
              className="flex items-center gap-2 justify-center mb-5 px-4 py-2.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <Download size={12} style={{ color: "rgba(255,255,255,0.3)" }} />
              <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                Screenshot this card to save your personalized plan
              </p>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-[10px] mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
              EatVera provides general wellness guidance and is not medical advice.
            </p>

            {/* CTA */}
            <button
              onClick={handleFinish}
              className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #c8e6a0 0%, #a3c97a 100%)",
                color: "#0a2010",
                boxShadow: "0 4px 32px rgba(164,201,122,0.35), inset 0 1px 0 rgba(255,255,255,0.3)",
                letterSpacing: "0.01em",
              }}
            >
              {isEditing ? "Save Changes" : "Start Using EatVera"}
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </LeafBackground>
    );
  }

  // ── Questionnaire ─────────────────────────────────────────────────────────
  return (
    <LeafBackground>
      <div className="flex flex-col h-full max-w-md mx-auto w-full">

        {/* Top nav */}
        <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
          <button
            onClick={step === 0
              ? (isRetake ? () => navigate("/settings") : () => setShowWelcome(true))
              : handleBack
            }
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <ChevronLeft size={18} style={{ color: "rgba(255,255,255,0.7)" }} />
          </button>

          <div className="flex-1 mx-4">
            <ProgressBar step={step} total={TOTAL_STEPS} />
          </div>

          {isRetake ? (
            <button
              onClick={() => navigate("/settings")}
              className="text-xs font-medium px-3 py-1.5 rounded-xl transition-all"
              style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4">
          <AnimatedStep stepKey={step} direction={direction}>

            {/* Conversational label */}
            <p
              className="text-[11px] font-mono tracking-[0.15em] uppercase mb-2 mt-2"
              style={{ color: "rgba(74,222,128,0.6)" }}
            >
              {cfg.conversational}
            </p>

            {/* Step title */}
            <h2
              className="text-white font-bold mb-4 leading-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.5rem, 5.5vw, 1.9rem)",
                letterSpacing: "-0.02em",
              }}
            >
              {cfg.title}
            </h2>

            {/* Why this matters */}
            <WhyMatters text={cfg.why} />

            {/* Live calorie preview (show from step 6 onward when we have enough data) */}
            {step >= 6 && liveCalories && (
              <CalorieBanner
                calories={liveCalories.calories}
                protein={liveCalories.protein}
                carbs={liveCalories.carbs}
                fat={liveCalories.fat}
              />
            )}

            {/* ── Step 0: Name ── */}
            {step === 0 && (
              <div className="space-y-4">
                <div
                  className="rounded-3xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    backdropFilter: "blur(16px)",
                  }}
                >
                  <input
                    type="text"
                    autoFocus
                    autoComplete="given-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && canAdvance()) handleNext(); }}
                    placeholder="Your first name"
                    className="w-full bg-transparent outline-none px-6 py-6 text-white placeholder:text-white/25 text-xl font-medium"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}
                  />
                </div>
                {name.trim().length > 0 && (
                  <p
                    className="text-center text-sm"
                    style={{ color: "rgba(74,222,128,0.7)" }}
                  >
                    Hi, {name.trim().charAt(0).toUpperCase() + name.trim().slice(1)} 👋
                  </p>
                )}
              </div>
            )}

            {/* ── Step 1: Gender ── */}
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {GENDERS.map((g, i) => (
                  <button
                    key={g.value}
                    onClick={() => setGender(g.value)}
                    className="relative flex flex-col items-center gap-2.5 px-4 py-5 rounded-2xl transition-all duration-200 active:scale-[0.97]"
                    style={{
                      background: gender === g.value
                        ? "linear-gradient(135deg, rgba(74,222,128,0.18), rgba(34,197,94,0.08))"
                        : "rgba(255,255,255,0.05)",
                      border: gender === g.value
                        ? "1px solid rgba(74,222,128,0.45)"
                        : "1px solid rgba(255,255,255,0.09)",
                      backdropFilter: "blur(16px)",
                      boxShadow: gender === g.value ? "0 0 0 1px rgba(74,222,128,0.15)" : "none",
                    }}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: gender === g.value ? "#e2fce9" : "rgba(255,255,255,0.75)" }}
                    >
                      {g.label}
                    </span>
                    {gender === g.value && (
                      <div
                        className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(74,222,128,0.25)", border: "1px solid rgba(74,222,128,0.4)" }}
                      >
                        <Check size={10} style={{ color: "#4ade80" }} strokeWidth={2.5} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Step 2: Height ── */}
            {step === 2 && (
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <div className="space-y-8">
                  <div>
                    <p className="text-green-400/50 text-[10px] font-mono tracking-[0.15em] uppercase text-center mb-5">Feet</p>
                    <StepperInput
                      value={heightFeet}
                      onDecrement={() => setHeightFeet(f => Math.max(3, f - 1))}
                      onIncrement={() => setHeightFeet(f => Math.min(8, f + 1))}
                      unit="ft" min={3} max={8}
                    />
                  </div>
                  <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <div>
                    <p className="text-green-400/50 text-[10px] font-mono tracking-[0.15em] uppercase text-center mb-5">Inches</p>
                    <StepperInput
                      value={heightInches}
                      onDecrement={() => setHeightInches(i => Math.max(0, i - 1))}
                      onIncrement={() => setHeightInches(i => Math.min(11, i + 1))}
                      unit="in" min={0} max={11}
                    />
                  </div>
                </div>
                <p className="text-center mt-6 text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {heightFeet}'{heightInches}" · {Math.round((heightFeet * 12 + heightInches) * 2.54)} cm
                </p>
              </div>
            )}

            {/* ── Step 3: Weight ── */}
            {step === 3 && (
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Unit toggle */}
                <div className="flex justify-center gap-2 mb-4">
                  {(["lbs", "kg"] as const).map(u => (
                    <button key={u} onClick={() => switchWeightUnit(u)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: weightUnit === u ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
                        color: weightUnit === u ? "#4ade80" : "rgba(255,255,255,0.35)",
                        border: `1px solid ${weightUnit === u ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      {u}
                    </button>
                  ))}
                </div>
                <div className="relative flex items-end justify-center gap-2 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={currentWeight}
                    onChange={e => setCurrentWeight(e.target.value)}
                    placeholder={weightUnit === "kg" ? "79" : "175"}
                    className="bg-transparent outline-none text-center font-bold text-white placeholder:text-white/15"
                    style={{
                      fontSize: "clamp(2.5rem, 12vw, 4rem)",
                      fontFamily: "'Playfair Display', Georgia, serif",
                      letterSpacing: "-0.03em",
                      width: "160px",
                    }}
                  />
                  <span className="text-xl font-medium mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>{weightUnit}</span>
                </div>
                <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {currentWeight && !isNaN(Number(currentWeight)) && Number(currentWeight) > 0
                    ? weightUnit === "lbs"
                      ? `${Math.round(Number(currentWeight) * 0.453592 * 10) / 10} kg`
                      : `${Math.round(Number(currentWeight) * 2.20462 * 10) / 10} lbs`
                    : "Enter your weight above"}
                </p>
              </div>
            )}

            {/* ── Step 4: Age ── */}
            {step === 4 && (
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                <StepperInput
                  value={age}
                  onDecrement={() => setAge(a => Math.max(13, a - 1))}
                  onIncrement={() => setAge(a => Math.min(100, a + 1))}
                  unit="yrs" min={13} max={100}
                />
                <p className="text-center mt-6 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {age < 25 ? "Young & building" : age < 40 ? "Prime years" : age < 55 ? "Experienced athlete" : "Wisdom & strength"}
                </p>
              </div>
            )}

            {/* ── Step 5: Current build ── */}
            {step === 5 && (
              <div className="space-y-2">
                {CURRENT_BUILDS.map((b, i) => (
                  <SelectCard
                    key={b.value}
                    selected={currentBuild === b.value}
                    onClick={() => setCurrentBuild(b.value)}
                    label={b.label}
                    sub={b.sub}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* ── Step 6: Archetype ── */}
            {step === 6 && (
              <div className="space-y-2.5">
                {ARCHETYPES.map((a, i) => (
                  <button
                    key={a.value}
                    onClick={() => setArchetype(a.value)}
                    className="w-full text-left transition-all duration-200 active:scale-[0.98]"
                  >
                    <div
                      className="relative flex items-center gap-4 px-4 py-4 rounded-2xl overflow-hidden"
                      style={{
                        background: archetype === a.value ? a.gradient : "rgba(255,255,255,0.05)",
                        border: `1px solid ${archetype === a.value ? a.border : "rgba(255,255,255,0.09)"}`,
                        backdropFilter: "blur(16px)",
                        boxShadow: archetype === a.value ? `0 4px 20px ${a.glow}` : "none",
                      }}
                    >
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: archetype === a.value ? `${a.color}22` : "rgba(255,255,255,0.07)",
                          border: `1px solid ${archetype === a.value ? `${a.color}44` : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        <a.icon size={20} style={{ color: archetype === a.value ? a.color : "rgba(255,255,255,0.4)" }} />
                      </div>
                      <div className="flex-1">
                        <p
                          className="font-bold text-sm leading-tight"
                          style={{ color: archetype === a.value ? "#f0fdf4" : "rgba(255,255,255,0.85)" }}
                        >
                          {a.label}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: archetype === a.value ? `${a.color}99` : "rgba(255,255,255,0.35)" }}
                        >
                          {a.sub}
                        </p>
                      </div>
                      {archetype === a.value && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: `${a.color}22`, border: `1px solid ${a.color}55` }}
                        >
                          <Check size={12} style={{ color: a.color }} strokeWidth={2.5} />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── Step 7: Desired build ── */}
            {step === 7 && (
              <div className="space-y-2">
                {DESIRED_BUILDS.map((b, i) => (
                  <SelectCard
                    key={b.value}
                    selected={desiredBuild === b.value}
                    onClick={() => setDesiredBuild(b.value)}
                    label={b.label}
                    sub={b.sub}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* ── Step 8: Main goal ── */}
            {step === 8 && (
              <div className="space-y-2">
                {MAIN_GOALS.map((g, i) => (
                  <SelectCard
                    key={g.value}
                    selected={mainGoal === g.value}
                    onClick={() => setMainGoal(g.value)}
                    label={g.label}
                    sub={g.sub}
                    icon={g.icon}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* ── Step 9: Desired weight (optional) ── */}
            {step === 9 && (
              <div
                className="rounded-3xl p-6"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
              >
                {/* Unit toggle (same as step 3, synced) */}
                <div className="flex justify-center gap-2 mb-4">
                  {(["lbs", "kg"] as const).map(u => (
                    <button key={u} onClick={() => switchWeightUnit(u)}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: weightUnit === u ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)",
                        color: weightUnit === u ? "#4ade80" : "rgba(255,255,255,0.35)",
                        border: `1px solid ${weightUnit === u ? "rgba(74,222,128,0.35)" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      {u}
                    </button>
                  ))}
                </div>
                <div className="relative flex items-end justify-center gap-2 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={desiredWeight}
                    onChange={e => setDesiredWeight(e.target.value)}
                    placeholder={weightUnit === "kg" ? "70" : "155"}
                    className="bg-transparent outline-none text-center font-bold text-white placeholder:text-white/15"
                    style={{
                      fontSize: "clamp(2.5rem, 12vw, 4rem)",
                      fontFamily: "'Playfair Display', Georgia, serif",
                      letterSpacing: "-0.03em",
                      width: "160px",
                    }}
                  />
                  <span className="text-xl font-medium mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>{weightUnit}</span>
                </div>
                <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {desiredWeight && !isNaN(Number(desiredWeight)) && Number(desiredWeight) > 0
                    ? (() => {
                        const dv = Number(desiredWeight);
                        const cv = Number(currentWeight);
                        const altUnit = weightUnit === "lbs" ? "kg" : "lbs";
                        const altVal = weightUnit === "lbs"
                          ? `${Math.round(dv * 0.453592 * 10) / 10} kg`
                          : `${Math.round(dv * 2.20462 * 10) / 10} lbs`;
                        const diff = currentWeight && cv > 0
                          ? dv < cv ? `${Math.round(Math.abs(dv - cv) * 10) / 10} ${weightUnit} to lose`
                          : dv > cv ? `${Math.round(Math.abs(dv - cv) * 10) / 10} ${weightUnit} to gain`
                          : "maintenance"
                          : "";
                        return `${altVal}${diff ? ` · ${diff}` : ""}`;
                      })()
                    : "Optional — tap skip to continue"}
                </p>
              </div>
            )}

            {/* ── Step 10: Timeframe ── */}
            {step === 10 && (
              <div className="space-y-2">
                {TIMEFRAMES.map((t, i) => (
                  <SelectCard
                    key={t.value}
                    selected={timeframe === t.value}
                    onClick={() => setTimeframe(t.value)}
                    label={t.label}
                    sub={t.sub}
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* ── Step 11: Eating style ── */}
            {step === 11 && (
              <div className="space-y-2.5">
                {EATING_STYLES.map((e, i) => (
                  <button
                    key={e.value}
                    onClick={() => setEatingStyle(e.value)}
                    className="w-full text-left transition-all duration-200 active:scale-[0.98]"
                  >
                    <div
                      className="flex items-center gap-4 px-4 py-4 rounded-2xl"
                      style={{
                        background: eatingStyle === e.value
                          ? "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.07))"
                          : "rgba(255,255,255,0.05)",
                        border: `1px solid ${eatingStyle === e.value ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.09)"}`,
                        backdropFilter: "blur(16px)",
                        boxShadow: eatingStyle === e.value ? "0 4px 20px rgba(74,222,128,0.1)" : "none",
                      }}
                    >
                      <span className="text-2xl flex-shrink-0">{e.emoji}</span>
                      <div className="flex-1">
                        <p
                          className="font-semibold text-sm"
                          style={{ color: eatingStyle === e.value ? "#e2fce9" : "rgba(255,255,255,0.85)" }}
                        >
                          {e.label}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: eatingStyle === e.value ? "rgba(74,222,128,0.65)" : "rgba(255,255,255,0.35)" }}
                        >
                          {e.sub}
                        </p>
                      </div>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: eatingStyle === e.value ? "rgba(74,222,128,0.25)" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${eatingStyle === e.value ? "rgba(74,222,128,0.5)" : "rgba(255,255,255,0.12)"}`,
                        }}
                      >
                        {eatingStyle === e.value && (
                          <Check size={12} style={{ color: "#4ade80" }} strokeWidth={2.5} />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="h-6" />
          </AnimatedStep>
        </div>

        {/* Bottom action area */}
        <div
          className="flex-shrink-0 px-5 pb-10 pt-4"
          style={{
            background: "linear-gradient(0deg, rgba(4,18,10,0.95) 0%, rgba(4,18,10,0.0) 100%)",
            backdropFilter: "blur(8px)",
          }}
        >
          {/* Skip button for optional step */}
          {step === 9 && (
            <button
              onClick={handleNext}
              className="w-full py-2.5 text-sm font-medium mb-2 transition-all"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Skip this step
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canAdvance()}
            className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40"
            style={{
              background: canAdvance()
                ? "linear-gradient(135deg, #c8e6a0 0%, #a3c97a 100%)"
                : "rgba(255,255,255,0.08)",
              color: canAdvance() ? "#0a2010" : "rgba(255,255,255,0.3)",
              boxShadow: canAdvance()
                ? "0 4px 32px rgba(164,201,122,0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "none",
              letterSpacing: "0.01em",
            }}
          >
            {step === TOTAL_STEPS - 1 ? "Build My Plan" : "Continue"}
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>

          <p className="text-center text-[10px] mt-3" style={{ color: "rgba(255,255,255,0.2)" }}>
            EatVera provides general wellness guidance and is not medical advice.
          </p>
        </div>
      </div>
    </LeafBackground>
  );
}
